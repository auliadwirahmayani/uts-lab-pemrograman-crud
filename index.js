const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const db = new Database("mahasiswa.db");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

db.exec(`
  CREATE TABLE IF NOT EXISTS mahasiswa (
    nim INTEGER PRIMARY KEY,
    nama TEXT NOT NULL,
    program_studi TEXT NOT NULL,
    angkatan INTEGER NOT NULL,
    ipk REAL NOT NULL CHECK (ipk >= 0 AND ipk <= 4)
  )
`);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/mahasiswa", (req, res) => {
  res.json(
    db.prepare("SELECT * FROM mahasiswa ORDER BY nim").all()
  );
});

app.post("/mahasiswa", (req, res) => {
  const { nim, nama, program_studi, angkatan, ipk } = req.body;
  const nilaiIPK = Number(ipk);
  const tahun = new Date().getFullYear();

  if (
    !nim || !nama?.trim() || !program_studi?.trim() ||
    !angkatan || ipk === "" ||
    !Number.isFinite(nilaiIPK) ||
    nilaiIPK < 0 || nilaiIPK > 4
  ) {
    return res.status(400).send("Data tidak valid. Periksa kembali semua input dan IPK (0–4).");
  }

  const nimAngka = Number(nim);
  const angkatanAngka = Number(angkatan);

  if (
    !Number.isSafeInteger(nimAngka) || nimAngka <= 0 ||
    !Number.isSafeInteger(angkatanAngka) ||
    angkatanAngka < 1900 || angkatanAngka > tahun
  ) {
    return res.status(400).send("NIM atau angkatan tidak valid.");
  }

  try {
    db.prepare(`
      INSERT INTO mahasiswa
      (nim, nama, program_studi, angkatan, ipk)
      VALUES (?, ?, ?, ?, ?)
    `).run(nimAngka, nama.trim(), program_studi.trim(), angkatanAngka, nilaiIPK);

    res.redirect("/");
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_PRIMARYKEY" ||
        error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(400).send("NIM sudah terdaftar.");
    }
    res.status(500).send("Terjadi kesalahan saat menyimpan data.");
  }
});

app.put("/mahasiswa/:nim", (req, res) => {
  const { nama, program_studi, angkatan, ipk } = req.body;
  const nilaiIPK = Number(ipk);
  const tahun = new Date().getFullYear();
  const angkatanAngka = Number(angkatan);

  if (
    !nama?.trim() || !program_studi?.trim() ||
    angkatan === "" || ipk === "" ||
    !Number.isFinite(nilaiIPK) ||
    nilaiIPK < 0 || nilaiIPK > 4 ||
    !Number.isSafeInteger(angkatanAngka) ||
    angkatanAngka < 1900 || angkatanAngka > tahun
  ) {
    return res.status(400).json({ error: "Data tidak valid." });
  }

  const result = db.prepare(`
    UPDATE mahasiswa
    SET nama = ?, program_studi = ?, angkatan = ?, ipk = ?
    WHERE nim = ?
  `).run(nama.trim(), program_studi.trim(), angkatanAngka, nilaiIPK, req.params.nim);

  res.json({ success: result.changes > 0 });
});

app.delete("/mahasiswa/:nim", (req, res) => {
  const result = db.prepare(
    "DELETE FROM mahasiswa WHERE nim = ?"
  ).run(req.params.nim);

  res.json({ success: result.changes > 0 });
});

app.listen(3000, () => {
  console.log("Aplikasi berjalan di http://localhost:3000");
});
