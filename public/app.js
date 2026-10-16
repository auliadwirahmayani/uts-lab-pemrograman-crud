const form = document.getElementById("formMahasiswa");
const daftar = document.getElementById("daftarMahasiswa");
const pesan = document.getElementById("pesan");

let dataMahasiswa = [];

async function muatData() {
  try {
    const response = await fetch("/mahasiswa");
    if (!response.ok) throw new Error("Gagal mengambil data");

    dataMahasiswa = await response.json();
    tampilkanData();
  } catch (error) {
    pesan.textContent = "Gagal memuat data mahasiswa.";
  }
}

function tampilkanData() {
  daftar.innerHTML = "";
  const tahunSekarang = new Date().getFullYear();

  dataMahasiswa.forEach((m) => {
    const baris = document.createElement("tr");
    const nilai = [
      m.nim,
      m.nama,
      m.program_studi,
      m.angkatan,
      Number(m.ipk).toFixed(2),
      tahunSekarang - m.angkatan + " tahun"
    ];

    nilai.forEach((isi) => {
      const sel = document.createElement("td");
      sel.textContent = isi;
      baris.appendChild(sel);
    });

    const aksi = document.createElement("td");

    const tombolEdit = document.createElement("button");
    tombolEdit.textContent = "Edit";
    tombolEdit.type = "button";
    tombolEdit.style.marginRight = "6px";
    tombolEdit.onclick = () => editMahasiswa(m);

    const tombolHapus = document.createElement("button");
    tombolHapus.textContent = "Hapus";
    tombolHapus.type = "button";
    tombolHapus.style.background = "#dc2626";
    tombolHapus.onclick = () => hapusMahasiswa(m.nim);

    aksi.append(tombolEdit, tombolHapus);
    baris.appendChild(aksi);
    daftar.appendChild(baris);
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  pesan.textContent = "";

  const data = Object.fromEntries(new FormData(form).entries());
  const sedangEdit = form.dataset.editNim;

  try {
    const response = sedangEdit
      ? await fetch(`/mahasiswa/${sedangEdit}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nama: data.nama,
            program_studi: data.program_studi,
            angkatan: data.angkatan,
            ipk: data.ipk
          })
        })
      : await fetch("/mahasiswa", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams(data)
        });

    if (!response.ok) {
      const hasil = await response.text();
      throw new Error(hasil || "Gagal menyimpan data.");
    }

    pesan.textContent = sedangEdit
      ? "Data mahasiswa berhasil diperbarui."
      : "Mahasiswa berhasil ditambahkan.";

    form.reset();
    delete form.dataset.editNim;
    form.querySelector('button[type="submit"]').textContent =
      "Simpan Mahasiswa";

    await muatData();
  } catch (error) {
    pesan.textContent = error.message;
  }
});

function editMahasiswa(m) {
  form.elements.nim.value = m.nim;
  form.elements.nim.readOnly = true;
  form.elements.nama.value = m.nama;
  form.elements.program_studi.value = m.program_studi;
  form.elements.angkatan.value = m.angkatan;
  form.elements.ipk.value = m.ipk;

  form.dataset.editNim = m.nim;
  form.querySelector('button[type="submit"]').textContent =
    "Simpan Perubahan";

  pesan.textContent = "Ubah data, lalu klik Simpan Perubahan.";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function hapusMahasiswa(nim) {
  if (!confirm(`Yakin ingin menghapus mahasiswa dengan NIM ${nim}?`)) {
    return;
  }

  try {
    const response = await fetch(`/mahasiswa/${nim}`, {
      method: "DELETE"
    });

    if (!response.ok) throw new Error("Gagal menghapus data.");

    pesan.textContent = "Data mahasiswa berhasil dihapus.";
    await muatData();
  } catch (error) {
    pesan.textContent = error.message;
  }
}

form.addEventListener("reset", () => {
  form.elements.nim.readOnly = false;
  delete form.dataset.editNim;
  form.querySelector('button[type="submit"]').textContent =
    "Simpan Mahasiswa";
});

muatData();
