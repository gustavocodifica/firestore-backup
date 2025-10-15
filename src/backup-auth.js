import admin from "firebase-admin";
import fs from "fs";

import { Storage } from "@google-cloud/storage";

const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

const bucketName = "backup-gclient";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const storage = new Storage({
  credentials: serviceAccount,
  projectId: serviceAccount.project_id,
});

async function exportUsers() {
  console.log("🚀 Iniciando exportação de usuários...");
  const users = [];
  let result = await admin.auth().listUsers(1000);
  users.push(...result.users);

  while (result.pageToken) {
    result = await admin.auth().listUsers(1000, result.pageToken);
    users.push(...result.users);
  }

  const filePath = `auth-backup-${new Date().toISOString().split("T")[0]}.json`;
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2));

  console.log(
    `📦 ${users.length} usuários exportados. Enviando para o bucket...`
  );

  await storage.bucket(bucketName).upload(filePath, {
    destination: `backup-auth/${filePath}`,
  });

  console.log("✅ Backup enviado com sucesso!");
}

exportUsers().catch((err) => {
  console.error("❌ Erro ao realizar backup:", err);
  process.exit(1);
});
