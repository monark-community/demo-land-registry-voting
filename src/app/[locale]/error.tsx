"use client"

import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"

const copy = {
  en: { title: "Something went wrong.", body: "The page hit an unexpected error. Your demo data is safe in your browser.", retry: "Try again" },
  fr: {
    title: "Une erreur est survenue.",
    body: "La page a rencontré une erreur inattendue. Vos données de démo sont intactes dans votre navigateur.",
    retry: "Réessayer",
  },
}

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const pathname = usePathname() ?? ""
  const c = pathname.startsWith("/fr") ? copy.fr : copy.en
  return (
    <div role="alert" className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-20">
      <h1 className="text-3xl font-extrabold tracking-display">{c.title}</h1>
      <p className="mt-3 text-muted-foreground">{c.body}</p>
      <div className="mt-6">
        <Button onClick={reset}>{c.retry}</Button>
      </div>
    </div>
  )
}
