import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminHash = await bcrypt.hash("Admin@1234", 12);
  const teacherHash = await bcrypt.hash("Teacher@1234", 12);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      fullName: "System Administrator",
      role: "admin",
      passwordHash: adminHash,
    },
  });

  const teacher = await prisma.user.upsert({
    where: { username: "teacher1" },
    update: {},
    create: {
      username: "teacher1",
      fullName: "John Smith",
      role: "teacher",
      passwordHash: teacherHash,
    },
  });

  const cls = await prisma.class.upsert({
    where: {
      grade_section_academicYear: {
        grade: "10",
        section: "A",
        academicYear: "2024-2025",
      },
    },
    update: {},
    create: {
      grade: "10",
      section: "A",
      academicYear: "2024-2025",
      teacherId: teacher.id,
    },
  });

  console.log("✓ Admin:", admin.username);
  console.log("✓ Teacher:", teacher.username);
  console.log("✓ Class: Grade", cls.grade, "- Section", cls.section);
  console.log("\nLogin credentials:");
  console.log("  admin    / Admin@1234");
  console.log("  teacher1 / Teacher@1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
