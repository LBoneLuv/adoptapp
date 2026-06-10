"use client"

import type React from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import { Bold, Italic, List, ListOrdered, Heading2, Heading3, LinkIcon, ImageIcon, Undo, Redo } from "lucide-react"
import { useRef } from "react"

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: false } as any),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
      Image.configure({ inline: false, HTMLAttributes: { class: "rounded-xl my-2 max-w-full" } }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[160px] px-4 py-3 focus:outline-none [&_p]:my-1 [&_h2]:font-bold [&_h2]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-[#6750A4] [&_a]:underline",
      },
    },
  })

  if (!editor) {
    return <div className="border-2 border-[#79747E] rounded-2xl h-48 bg-[#FFFBFE] animate-pulse" />
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !editor) return
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    if (res.ok) {
      const { url } = await res.json()
      editor.chain().focus().setImage({ src: url }).run()
    }
    e.target.value = ""
  }

  function setLink() {
    const prev = editor!.getAttributes("link").href as string | undefined
    const url = window.prompt("URL del enlace:", prev || "https://")
    if (url === null) return
    if (url === "") {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  const Btn = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void
    active?: boolean
    children: React.ReactNode
    title: string
  }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
        active ? "bg-[#6750A4] text-white" : "text-[#49454F] hover:bg-[#E8DEF8]"
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="border-2 border-[#79747E] rounded-2xl bg-[#FFFBFE] overflow-hidden focus-within:border-[#6750A4]">
      {/* Toolbar */}
      <div className="flex items-center gap-1 flex-wrap px-2 py-1.5 border-b border-[#E8DEF8] bg-[#FEF7FF]">
        <Btn title="Negrita" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
          <Bold className="w-4 h-4" />
        </Btn>
        <Btn title="Cursiva" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
          <Italic className="w-4 h-4" />
        </Btn>
        <span className="w-px h-5 bg-[#E8DEF8] mx-1" />
        <Btn title="Título" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>
          <Heading2 className="w-4 h-4" />
        </Btn>
        <Btn title="Subtítulo" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}>
          <Heading3 className="w-4 h-4" />
        </Btn>
        <Btn title="Lista" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
          <List className="w-4 h-4" />
        </Btn>
        <Btn title="Lista numerada" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>
          <ListOrdered className="w-4 h-4" />
        </Btn>
        <span className="w-px h-5 bg-[#E8DEF8] mx-1" />
        <Btn title="Enlace" onClick={setLink} active={editor.isActive("link")}>
          <LinkIcon className="w-4 h-4" />
        </Btn>
        <Btn title="Imagen" onClick={() => fileInputRef.current?.click()}>
          <ImageIcon className="w-4 h-4" />
        </Btn>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        <span className="w-px h-5 bg-[#E8DEF8] mx-1" />
        <Btn title="Deshacer" onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="w-4 h-4" />
        </Btn>
        <Btn title="Rehacer" onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="w-4 h-4" />
        </Btn>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}
