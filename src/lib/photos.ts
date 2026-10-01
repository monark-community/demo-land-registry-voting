import type { StaticImageData } from "next/image"

import aerial from "../../public/images/aerial-lots.jpg"
import hearing from "../../public/images/hearing-room.jpg"
import neighbours from "../../public/images/neighbours.jpg"

/** Every photograph on the site, with its Unsplash credit (see docs/assets.md). */
export interface Photo {
  src: StaticImageData
  photographer: string
  profile: string
  page: string
  usedOn: { en: string; fr: string }
}

export const PHOTOS = {
  aerial: {
    src: aerial,
    photographer: "Florian Schmid",
    profile: "https://unsplash.com/@florianschmid",
    page: "https://unsplash.com/photos/EzmfUgcKrt4",
    usedOn: { en: "Home, “From the plan to the street”", fr: "Accueil, « Du plan à la rue »" },
  },
  hearing: {
    src: hearing,
    photographer: "Mikael Kristenson",
    profile: "https://unsplash.com/@mikael_k",
    page: "https://unsplash.com/photos/3aVlWP-7bg8",
    usedOn: { en: "Home, “The hearing problem”", fr: "Accueil, « Le problème de l'assemblée publique »" },
  },
  neighbours: {
    src: neighbours,
    photographer: "Beth Macdonald",
    profile: "https://unsplash.com/@elsbethcat",
    page: "https://unsplash.com/photos/7qkTpESaZp4",
    usedOn: { en: "Home, “One vote, three people who trust it”", fr: "Accueil, « Un vote, trois parties qui s'y fient »" },
  },
} satisfies Record<string, Photo>
