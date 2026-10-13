"use client";
import { useActionState, useRef, useState } from "react";
import { deletePost, savePost, type PostFormState } from "@/app/admin/actions/posts";
import { Markdown } from "@/components/markdown";
import { ImageField } from "./image-field";
import { Notice } from "./notice";
import { uploadImage } from "./upload";
import type { Post } from "@/lib/types";

type Props = {
  post: Post | null;
  userId: string;
  knownTags: string[];
  canEdit: boolean;
  justDid?: string;
};

type ToolId = "bold" | "italic" | "heading" | "link" | "list" | "numbered" | "quote" | "table";

const TOOLS: { id: ToolId; label: string; title: string }[] = [
  { id: "bold", label: "B", title: "Bold" },
  { id: "italic", label: "I", title: "Italic" },
  { id: "heading", label: "H", title: "Section heading" },
  { id: "link", label: "Link", title: "Add a link" },
  { id: "list", label: "List", title: "Bulleted list" },
  { id: "numbered", label: "1.", title: "Numbered list" },
  { id: "quote", label: "Quote", title: "Quote" },
  { id: "table", label: "Table", title: "Insert a table" },
];

const DONE_MESSAGES: Record<string, string> = {
  published: "Published. It's live on the blog.",
  saved: "Draft saved.",
  updated: "Changes are live.",
  unpublished: "Unpublished.",
};

export function PostEditor({ post, userId, knownTags, canEdit, justDid }: Props) {
  const [state, action, pending] = useActionState<PostFormState, FormData>(savePost, {});
  const [body, setBody] = useState(post?.body ?? "");
  const [tags, setTags] = useState(post?.tags.join(", ") ?? "");
  const [title, setTitle] = useState(post?.title ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [byline, setByline] = useState(post?.byline ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  const isPublished = post?.status === "published";
  const currentTags = tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
  const suggestions = knownTags.filter((t) => !currentTags.includes(t.toLowerCase())).slice(0, 10);
  const message = state.message ?? (justDid && !state.error ? DONE_MESSAGES[justDid] : undefined);

  function edit(fn: (sel: { before: string; selected: string; after: string }) => { text: string; cursor: [number, number] }) {
    const el = textarea.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const result = fn({ before: value.slice(0, s), selected: value.slice(s, e), after: value.slice(e) });
    setBody(result.text);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(result.cursor[0], result.cursor[1]);
    });
  }

  const wrap = (mark: string, placeholder: string) =>
    edit(({ before, selected, after }) => {
      const inner = selected || placeholder;
      return {
        text: `${before}${mark}${inner}${mark}${after}`,
        cursor: [before.length + mark.length, before.length + mark.length + inner.length],
      };
    });

  const linePrefix = (prefix: string, placeholder: string) =>
    edit(({ before, selected, after }) => {
      const atLineStart = before === "" || before.endsWith("\n");
      const lead = atLineStart ? "" : "\n";
      const lines = (selected || placeholder).split("\n").map((l, i) => (prefix === "1. " ? `${i + 1}. ` : prefix) + l);
      const inserted = lead + lines.join("\n");
      return { text: before + inserted + after, cursor: [before.length + lead.length + prefix.length, before.length + inserted.length] };
    });

  const insertBlock = (block: string) =>
    edit(({ before, after }) => {
      const lead = before === "" || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
      const text = `${before}${lead}${block}\n\n${after}`;
      const pos = before.length + lead.length + block.length + 2;
      return { text, cursor: [pos, pos] };
    });

  const addLink = () =>
    edit(({ before, selected, after }) => {
      const label = selected || "link text";
      const inserted = `[${label}](https://)`;
      const urlStart = before.length + label.length + 3;
      return { text: before + inserted + after, cursor: [urlStart, urlStart + 8] };
    });

  async function onImagePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const url = await uploadImage(file, userId);
      const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      insertBlock(`![${alt}](${url})`);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function addTag(t: string) {
    setTags((prev) => (prev.trim() ? `${prev.replace(/,\s*$/, "")}, ${t}` : t));
  }

  function runTool(id: ToolId) {
    switch (id) {
      case "bold": return wrap("**", "bold text");
      case "italic": return wrap("*", "italic text");
      case "heading": return linePrefix("## ", "Section heading");
      case "link": return addLink();
      case "list": return linePrefix("- ", "List item");
      case "numbered": return linePrefix("1. ", "First step");
      case "quote": return linePrefix("> ", "Quoted text");
      case "table": return insertBlock("| Column one | Column two |\n| --- | --- |\n| Value | Value |\n| Value | Value |");
    }
  }

  return (
    <div>
      {message && <div className="mb-6"><Notice>{message}</Notice></div>}
      {state.error && <div className="mb-6"><Notice tone="error">{state.error}</Notice></div>}
      {!canEdit && (
        <div className="mb-6">
          <Notice tone="info">Only the author or the admin can edit this post. You're viewing it read-only.</Notice>
        </div>
      )}

      <form action={action} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <input type="hidden" name="id" value={post?.id ?? ""} />
        <input type="hidden" name="body" value={body} />

        <fieldset disabled={!canEdit} className="min-w-0 space-y-6">
          <div>
            <label htmlFor="title" className="label">Title</label>
            <input
              id="title"
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's the post about?"
              className="field headline !text-[1.6rem] !leading-tight"
              style={{ fontFamily: "var(--font-serif)" }}
            />
          </div>

          <div>
            <label htmlFor="excerpt" className="label">Summary</label>
            <textarea
              id="excerpt"
              name="excerpt"
              rows={2}
              maxLength={300}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="One or two sentences shown on the home page and in the newsletter."
              className="field"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <span className="label">Post</span>
              <div role="tablist" className="flex text-[0.875rem]">
                {(["write", "preview"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={tab === t}
                    onClick={() => setTab(t)}
                    className={`border-b-2 px-3 py-1 font-medium capitalize ${tab === t ? "border-accent text-ink" : "border-transparent text-slate"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {tab === "write" ? (
              <div className="border border-rule bg-surface">
                <div className="flex flex-wrap gap-1 border-b border-rule p-1.5">
                  {TOOLS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      title={t.title}
                      aria-label={t.title}
                      onClick={() => runTool(t.id)}
                      className={`rounded px-2.5 py-1 text-[0.875rem] text-slate hover:bg-paper hover:text-ink ${
                        t.label === "B" ? "font-bold" : t.label === "I" ? "font-serif italic" : "font-medium"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => imageInput.current?.click()}
                    disabled={uploading}
                    className="rounded px-2.5 py-1 text-[0.875rem] font-medium text-slate hover:bg-paper hover:text-ink"
                  >
                    {uploading ? "Uploading image" : "Image or chart"}
                  </button>
                  <input ref={imageInput} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={onImagePicked} />
                </div>
                <textarea
                  ref={textarea}
                  aria-label="Post text"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={22}
                  placeholder={"Start writing. Use the buttons above for headings, lists, links, and images.\n\nLeave a blank line between paragraphs."}
                  className="block w-full resize-y bg-transparent p-4 font-serif text-[1.0625rem] leading-relaxed outline-none"
                />
              </div>
            ) : (
              <div className="min-h-[24rem] border border-rule bg-surface p-6">
                {body.trim() ? <Markdown source={body} /> : <p className="text-muted">Nothing to preview yet.</p>}
              </div>
            )}
            {uploadError && <p role="alert" className="mt-2 text-sm text-danger">{uploadError}</p>}
            <p className="hint">
              To add a chart, export it as an image (from Google Sheets, Excel, or FRED) and use Image or chart.
            </p>
          </div>
        </fieldset>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {canEdit && (
            <div className="space-y-2 border border-rule bg-surface p-4">
              <p className="text-[0.875rem] text-slate">
                {isPublished ? "This post is live." : post ? "This post is a draft. Only officers can see it." : "New post. Save it as a draft or publish it."}
              </p>
              <button type="submit" name="intent" value="publish" disabled={pending} className="btn btn-primary w-full">
                {pending ? "Saving" : isPublished ? "Update post" : "Publish"}
              </button>
              {isPublished ? (
                <button type="submit" name="intent" value="unpublish" disabled={pending} className="btn btn-quiet w-full">
                  Unpublish
                </button>
              ) : (
                <button type="submit" name="intent" value="draft" disabled={pending} className="btn btn-quiet w-full">
                  Save draft
                </button>
              )}
              {isPublished && (
                <a href={`/blog/${post!.slug}`} target="_blank" className="block pt-1 text-center text-[0.875rem] text-accent-ink hover:underline">
                  View on site
                </a>
              )}
            </div>
          )}

          <fieldset disabled={!canEdit} className="space-y-6">
            <div>
              <label htmlFor="tags" className="label">Tags</label>
              <input
                id="tags"
                name="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Macro, Markets"
                className="field"
              />
              <p className="hint">Separate with commas.</p>
              {suggestions.length > 0 && canEdit && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {suggestions.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => addTag(t)}
                      className="rounded-full border border-rule px-2.5 py-0.5 text-[0.8125rem] text-slate hover:border-accent hover:text-ink"
                    >
                      + {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <ImageField
              name="cover_url"
              label="Cover image"
              hint="Optional. Shown at the top of the post and on the home page."
              userId={userId}
              initialUrl={post?.cover_url ?? null}
              disabled={!canEdit}
            />

            <div>
              <label htmlFor="byline" className="label">Written by a member?</label>
              <input id="byline" name="byline" value={byline} onChange={(e) => setByline(e.target.value)} placeholder="Their name" className="field" />
              <p className="hint">Leave empty to show your name.</p>
            </div>

            <div>
              <label htmlFor="slug" className="label">Web address</label>
              <div className="flex items-center gap-1 text-[0.875rem] text-muted">
                <span>/blog/</span>
                <input id="slug" name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="made-from-title" className="field !py-1.5" />
              </div>
              <p className="hint">Leave empty to make one from the title.</p>
            </div>
          </fieldset>
        </aside>
      </form>

      {post && canEdit && (
        <form
          action={deletePost}
          className="mt-12 border-t border-rule pt-6"
          onSubmit={(e) => {
            if (!confirm("Delete this post for good? This can't be undone.")) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={post.id} />
          <button className="btn btn-danger">Delete post</button>
        </form>
      )}
    </div>
  );
}
