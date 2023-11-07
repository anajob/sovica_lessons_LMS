import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  const email = "rachel@remix.run";

  // cleanup the existing database
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  });

  const hashedPassword = await bcrypt.hash("racheliscool", 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });

  await prisma.note.create({
    data: {
      title: "My first note",
      body: "Hello, world!",
      userId: user.id,
    },
  });

  await prisma.note.create({
    data: {
      title: "My second note",
      body: "Hello, world!",
      userId: user.id,
    },
  });

  const categories = [
    { id: 1, name: "knjizevnost" },
    { id: 2, name: "pravopis" },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: category,
      create: category,
    });
  }

  const lekcije = [
    {
      id: 1,
      title: "Ovo je prva lekcija",
      content: "Ovo je kontent prve lekcije",
      videoLink: "https://www.youtube.com/watch?v=62RvRQuMVyg&t=1269s",
      categoryId: 1,
    },
    {
      id: 2,
      title: "Ovo je druga lekcija",
      content: "Ovo je kontent druge lekcije",
      videoLink: "https://www.youtube.com/watch?v=VsgWgDyC84c",
      categoryId: 2,
    },
  ];

  for (const lekcija of lekcije) {
    await prisma.lekcija.upsert({
      where: { id: lekcija.id },
      update: lekcija,
      create: lekcija,
    });
  }

  const adminUser = {
    id: 1,
    email: "admin@gmail.com",
    password: "jasamadmin",
    nickName: "Admincic",
    role: "admin",
    imgUrl:
      "https://www.shutterstock.com/image-photo/funny-large-longhair-gray-kitten-beautiful-1842198919",
    public_id: "remixImages/hriwcfcrsux7beyj6jef",
    token: "aem;ar;aemrema;mfametmea;ldsfssfg",
  };

  await prisma.adminUser.upsert({
    where: { id: adminUser.id },
    update: adminUser,
    create: adminUser,
  });

  console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
