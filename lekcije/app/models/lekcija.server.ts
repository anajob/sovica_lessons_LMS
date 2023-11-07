import { prisma } from "~/db.server";
const PER_PAGE = 3;

export async function getLekcije(
  searchQuery: string,
  categoryIdQuery: number | undefined,
  pageNumber: number,
  sortByQueryDirection: "asc" | "desc" | undefined,
  sortByColumn: "title" | "createdAt" | undefined
) {
  if (sortByQueryDirection === undefined) {
    sortByQueryDirection = "desc";
  }

  if (sortByColumn === undefined) {
    sortByColumn = "createdAt";
  }

  const skip = pageNumber * PER_PAGE;
  return prisma.lekcija.findMany({
    where: {
      title: {
        contains: searchQuery,
      },
      categoryId: categoryIdQuery,
    },
    skip: skip,
    take: PER_PAGE,
    orderBy: [
      {
        [sortByColumn]: sortByQueryDirection,
      },
    ],
  });
}
export async function countLekcije(
  searchQuery: string,
  categoryIdQuery: number | undefined
) {
  return prisma.lekcija.count({
    where: {
      title: {
        contains: searchQuery,
      },
      categoryId: categoryIdQuery,
    },
  });
}

export async function getLekcija(id: number) {
  return prisma.lekcija.findUnique({ where: { id } });
}
type Lekcija = {
  id: number;
  payload: {
    title: string;
    videoLink: string;
    content: string;
    categoryId: number | null;
  };
};

export async function updateLekcija(lekcija: Lekcija) {
  return prisma.lekcija.update({
    where: { id: lekcija.id },
    data: {
      title: lekcija.payload.title,
      videoLink: lekcija.payload.videoLink,
      content: lekcija.payload.content,
      categoryId: lekcija.payload.categoryId,
    },
  });
}

export async function deleteLekcija(id: number) {
  return prisma.lekcija.delete({
    where: {
      id: id,
    },
  });
}

export async function createLekcija(
  lekcija: Pick<
    Lekcija["payload"],
    "title" | "videoLink" | "content" | "categoryId"
  >
) {
  return prisma.lekcija.create({
    data: {
      title: lekcija.title,
      videoLink: lekcija.videoLink,
      content: lekcija.content,
      categoryId: lekcija.categoryId,
    },
  });
}
