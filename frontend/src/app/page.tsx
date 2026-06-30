"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { driver } from "driver.js";
import Swal from "sweetalert2";
import "driver.js/dist/driver.css";
import "sweetalert2/dist/sweetalert2.min.css";
import styles from "./page.module.css";
import { IpkGauge, ProbabilityBarChart } from "./components/Charts";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Helper: Menghasilkan angka acak di rentang min - max (inklusif)
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Fungsi untuk menghasilkan data dummy acak yang realistis
const generateRandomStudent = () => ({
  age: randomInt(1, 3),
  sex: randomInt(1, 2),
  graduated_h_school_type: randomInt(1, 3),
  scholarship_type: randomInt(1, 5),
  additional_work: randomInt(1, 2),
  activity: randomInt(1, 2),
  partner: randomInt(1, 2),
  total_salary: randomInt(1, 5),
  transport: randomInt(1, 4),
  accomodation: randomInt(1, 4),
  mother_ed: randomInt(1, 6),
  farther_ed: randomInt(1, 6),
  siblings: randomInt(1, 5),
  parental_status: randomInt(1, 3),
  mother_occup: randomInt(1, 5),
  father_occup: randomInt(1, 5),
  weekly_study_hours: randomInt(1, 5),
  reading_non_scientific: randomInt(1, 10),
  reading_scientific: randomInt(0, 10),
  attendance_seminars_dep: randomInt(1, 2),
  impact_of_projects: randomInt(1, 10),
  attendances_classes: randomInt(1, 2),
  preparation_midterm_company: randomInt(1, 3),
  preparation_midterm_time: randomInt(1, 3),
  taking_notes: randomInt(1, 10),
  listenning: randomInt(1, 10),
  discussion_improves_interest: randomInt(1, 10),
  flip_classrom: 3,
  grade_previous: randomInt(1, 5),
  grade_expected: randomInt(1, 4),
  course_id: randomInt(1, 9),
});

type StudentField = keyof ReturnType<typeof generateRandomStudent>;
type StudentFormData = Record<StudentField, number | "">;
type TabKey = "academic" | "demographics" | "study" | "social";
type FieldOption = { value: number; label: string };
type FieldConfig = {
  label: string;
  placeholder: string;
  helperText?: string;
  tab: TabKey;
  options?: FieldOption[];
  numberInput?: {
    min: number;
    max: number;
  };
};

const yesNoOptions = (yesLabel = "Ya", noLabel = "Tidak"): FieldOption[] => [
  { value: 1, label: yesLabel },
  { value: 2, label: noLabel },
];

const scaleOptions = (lowLabel: string, highLabel: string): FieldOption[] =>
  Array.from({ length: 10 }, (_, index) => {
    const value = index + 1;
    const suffix = value === 1 ? ` - ${lowLabel}` : value === 10 ? ` - ${highLabel}` : "";
    return { value, label: `${value}${suffix}` };
  });

const weeklyCountOptions: FieldOption[] = [
  ...Array.from({ length: 11 }, (_, index) => ({
    value: index,
    label: `${index} kali per minggu`,
  })),
  { value: 11, label: ">10 kali per minggu" },
];

const gradePreviousOptions: FieldOption[] = [
  { value: 1, label: "IPK < 2.00" },
  { value: 2, label: "IPK 2.00 - 2.49" },
  { value: 3, label: "IPK 2.50 - 2.99" },
  { value: 4, label: "IPK 3.00 - 3.49" },
  { value: 5, label: "IPK 3.50 - 4.00" },
];

const FIELD_CONFIG: Record<StudentField, FieldConfig> = {
  course_id: {
    label: "ID Mata Kuliah",
    placeholder: "Contoh: 0 - 10",
    helperText: "Isi kode numerik mata kuliah dari 0 sampai 10.",
    tab: "academic",
    numberInput: {
      min: 0,
      max: 10,
    },
  },
  grade_expected: {
    label: "IPK yang Diharapkan",
    placeholder: "Pilih rentang IPK yang ditargetkan",
    tab: "academic",
    options: gradePreviousOptions.slice(0, 4),
  },
  grade_previous: {
    label: "IPK Semester Sebelumnya",
    placeholder: "Pilih rentang IPK semester sebelumnya",
    tab: "academic",
    options: gradePreviousOptions,
  },
  scholarship_type: {
    label: "Jenis Beasiswa (Semester Saat Ini)",
    placeholder: "Pilih jenis beasiswa semester saat ini",
    tab: "academic",
    options: [
      { value: 1, label: "Tidak ada beasiswa" },
      { value: 2, label: "Potongan 25%" },
      { value: 3, label: "Potongan 50%" },
      { value: 4, label: "Potongan 75%" },
      { value: 5, label: "Beasiswa penuh 100%" },
    ],
  },
  graduated_h_school_type: {
    label: "Asal Sekolah Menengah",
    placeholder: "Pilih asal sekolah menengah",
    tab: "academic",
    options: [
      { value: 1, label: "Sekolah swasta" },
      { value: 2, label: "Sekolah negeri" },
      { value: 3, label: "Lainnya" },
    ],
  },
  age: {
    label: "Kelompok Umur",
    placeholder: "Pilih kelompok umur",
    tab: "demographics",
    options: [
      { value: 1, label: "18 - 21 tahun" },
      { value: 2, label: "22 - 25 tahun" },
      { value: 3, label: "26 tahun atau lebih" },
    ],
  },
  sex: {
    label: "Jenis Kelamin",
    placeholder: "Pilih jenis kelamin",
    tab: "demographics",
    options: [
      { value: 1, label: "Perempuan" },
      { value: 2, label: "Laki-laki" },
    ],
  },
  siblings: {
    label: "Jumlah Saudara Kandung",
    placeholder: "Pilih jumlah saudara kandung",
    helperText: "Sesuai rentang data pelatihan model (1–5). Pilih \"5 atau lebih\" untuk keluarga besar.",
    tab: "demographics",
    options: [
      { value: 1, label: "1 saudara" },
      { value: 2, label: "2 saudara" },
      { value: 3, label: "3 saudara" },
      { value: 4, label: "4 saudara" },
      { value: 5, label: "5 saudara atau lebih" },
    ],
  },
  parental_status: {
    label: "Status Orang Tua",
    placeholder: "Pilih status orang tua",
    tab: "demographics",
    options: [
      { value: 1, label: "Menikah" },
      { value: 2, label: "Bercerai" },
      { value: 3, label: "Salah satu atau kedua orang tua meninggal" },
    ],
  },
  partner: {
    label: "Status Hubungan",
    placeholder: "Pilih status hubungan",
    tab: "demographics",
    options: yesNoOptions("Memiliki pasangan", "Tidak memiliki pasangan"),
  },
  mother_ed: {
    label: "Tingkat Pendidikan Ibu",
    placeholder: "Pilih pendidikan ibu",
    tab: "demographics",
    options: [
      { value: 1, label: "SD / sederajat" },
      { value: 2, label: "SMP / sederajat" },
      { value: 3, label: "SMA / sederajat" },
      { value: 4, label: "Sarjana / diploma" },
      { value: 5, label: "Magister (S2)" },
      { value: 6, label: "Doktor (S3)" },
    ],
  },
  farther_ed: {
    label: "Tingkat Pendidikan Ayah",
    placeholder: "Pilih pendidikan ayah",
    tab: "demographics",
    options: [
      { value: 1, label: "SD / sederajat" },
      { value: 2, label: "SMP / sederajat" },
      { value: 3, label: "SMA / sederajat" },
      { value: 4, label: "Sarjana / diploma" },
      { value: 5, label: "Magister (S2)" },
      { value: 6, label: "Doktor (S3)" },
    ],
  },
  mother_occup: {
    label: "Pekerjaan Ibu",
    placeholder: "Pilih pekerjaan ibu",
    tab: "demographics",
    options: [
      { value: 1, label: "Pensiunan" },
      { value: 2, label: "Ibu rumah tangga / tidak bekerja" },
      { value: 3, label: "Pegawai pemerintah" },
      { value: 4, label: "Pegawai swasta" },
      { value: 5, label: "Wiraswasta" },
    ],
  },
  father_occup: {
    label: "Pekerjaan Ayah",
    placeholder: "Pilih pekerjaan ayah",
    tab: "demographics",
    options: [
      { value: 1, label: "Pensiunan" },
      { value: 2, label: "Tidak bekerja" },
      { value: 3, label: "Pegawai pemerintah" },
      { value: 4, label: "Pegawai swasta" },
      { value: 5, label: "Wiraswasta" },
    ],
  },
  weekly_study_hours: {
    label: "Total Jam Belajar per Minggu",
    placeholder: "Pilih total jam belajar per minggu",
    helperText: "Akumulasi waktu belajar mandiri, tugas, dan persiapan kelas dalam 1 minggu.",
    tab: "study",
    options: [
      { value: 1, label: "0 jam / tidak belajar rutin" },
      { value: 2, label: "Kurang dari 5 jam per minggu" },
      { value: 3, label: "6 - 10 jam per minggu" },
      { value: 4, label: "11 - 20 jam per minggu" },
      { value: 5, label: "Lebih dari 20 jam per minggu" },
    ],
  },
  reading_non_scientific: {
    label: "Minat Membaca Non-Ilmiah (Skala 1-10)",
    placeholder: "Pilih tingkat minat membaca non-ilmiah",
    helperText: "Bacaan non-ilmiah: novel, berita, blog, artikel populer, atau bacaan umum. 1 = tidak minat, 10 = sangat minat.",
    tab: "study",
    options: scaleOptions("tidak minat", "sangat minat"),
  },
  reading_scientific: {
    label: "Total Membaca Jurnal / Buku Ilmiah per Minggu",
    placeholder: "Pilih total membaca ilmiah per minggu",
    helperText: "Hitung jumlah sesi/kali membaca jurnal, paper, textbook, atau buku ilmiah dalam 1 minggu.",
    tab: "study",
    options: weeklyCountOptions,
  },
  attendances_classes: {
    label: "Konsistensi Kehadiran di Kelas",
    placeholder: "Pilih konsistensi hadir di kelas",
    helperText: "Kehadiran di kelas berarti hadir pada perkuliahan reguler semester berjalan.",
    tab: "study",
    options: [
      { value: 1, label: "Hadir rutin / hampir selalu hadir" },
      { value: 2, label: "Tidak rutin / sering absen" },
    ],
  },
  attendance_seminars_dep: {
    label: "Kehadiran di Seminar dalam 1-3 Bulan Terakhir",
    placeholder: "Pilih kehadiran seminar 1-3 bulan terakhir",
    helperText: "Seminar mencakup seminar kampus, departemen, webinar akademik, atau workshop ilmiah.",
    tab: "study",
    options: [
      { value: 1, label: "Pernah hadir minimal 1 kali" },
      { value: 2, label: "Tidak pernah hadir" },
    ],
  },
  impact_of_projects: {
    label: "Dampak Tugas/Proyek terhadap Fokus Belajar (Skala 1-10)",
    placeholder: "Pilih tingkat distraksi dari tugas/proyek",
    helperText: "1 = tugas/proyek tidak mendistraksi belajar, 10 = sangat mendistraksi belajar.",
    tab: "study",
    options: scaleOptions("tidak terdistraksi", "sangat terdistraksi"),
  },
  preparation_midterm_company: {
    label: "Cara Belajar untuk Persiapan UTS",
    placeholder: "Pilih cara persiapan UTS",
    helperText: "Menjelaskan apakah mahasiswa biasanya belajar sendiri, belajar bersama teman, atau tidak punya persiapan khusus.",
    tab: "study",
    options: [
      { value: 1, label: "Belajar sendiri" },
      { value: 2, label: "Belajar bersama teman" },
      { value: 3, label: "Tidak ada persiapan khusus" },
    ],
  },
  preparation_midterm_time: {
    label: "Lama Persiapan UTS (Hari Sebelum Ujian)",
    placeholder: "Pilih lama persiapan UTS",
    helperText: "Perkiraan kapan mahasiswa mulai belajar khusus untuk UTS.",
    tab: "study",
    options: [
      { value: 1, label: "H-1 / mendekati hari ujian" },
      { value: 2, label: "2 - 7 hari sebelum ujian" },
      { value: 3, label: ">7 hari / rutin selama semester" },
    ],
  },
  taking_notes: {
    label: "Rajin Mencatat Materi (Skala 1-10)",
    placeholder: "Pilih tingkat kerajinan mencatat",
    helperText: "1 = tidak rajin mencatat, 10 = sangat rajin mencatat.",
    tab: "study",
    options: scaleOptions("tidak rajin", "sangat rajin"),
  },
  listenning: {
    label: "Kemampuan Menyimak Materi di Kelas (Skala 1-10)",
    placeholder: "Pilih kemampuan menyimak materi",
    helperText: "1 = sulit fokus menyimak, 10 = sangat mampu menyimak.",
    tab: "study",
    options: scaleOptions("sulit menyimak", "sangat mampu menyimak"),
  },
  discussion_improves_interest: {
    label: "Minat Meningkat karena Diskusi (Skala 1-10)",
    placeholder: "Pilih peningkatan minat karena diskusi",
    helperText: "1 = tidak minat, 10 = sangat minat setelah diskusi.",
    tab: "study",
    options: scaleOptions("tidak minat", "sangat minat"),
  },
  flip_classrom: {
    label: "Default Metode Kelas",
    placeholder: "Default internal",
    tab: "study",
    options: [
      { value: 1, label: "Tidak berguna" },
      { value: 2, label: "Berguna" },
      { value: 3, label: "Tidak pernah / tidak relevan" },
    ],
  },
  additional_work: {
    label: "Pekerjaan Sampingan",
    placeholder: "Pilih status pekerjaan sampingan",
    tab: "social",
    options: yesNoOptions("Ada pekerjaan sampingan", "Tidak ada pekerjaan sampingan"),
  },
  activity: {
    label: "Kegiatan Organisasi / UKM",
    placeholder: "Pilih aktivitas organisasi / UKM",
    tab: "social",
    options: yesNoOptions("Aktif organisasi / UKM", "Tidak aktif"),
  },
  total_salary: {
    label: "Penghasilan / Uang Saku Bulanan",
    placeholder: "Pilih rentang penghasilan bulanan",
    helperText: "Kategori 1 (terendah) s/d 5 (tertinggi) — urutan mengikuti kategori data pelatihan model.",
    tab: "social",
    options: [
      { value: 1, label: "< Rp 500 ribu / bulan" },
      { value: 2, label: "Rp 500 ribu – 1 juta / bulan" },
      { value: 3, label: "Rp 1 juta – 2 juta / bulan" },
      { value: 4, label: "Rp 2 juta – 3,5 juta / bulan" },
      { value: 5, label: "> Rp 3,5 juta / bulan" },
    ],
  },
  transport: {
    label: "Moda Transportasi",
    placeholder: "Pilih moda transportasi",
    tab: "social",
    options: [
      { value: 1, label: "Bus / transportasi umum" },
      { value: 2, label: "Mobil pribadi / taksi" },
      { value: 3, label: "Sepeda" },
      { value: 4, label: "Lainnya" },
    ],
  },
  accomodation: {
    label: "Jenis Tempat Tinggal",
    placeholder: "Pilih jenis tempat tinggal",
    tab: "social",
    options: [
      { value: 1, label: "Sewa / kos" },
      { value: 2, label: "Asrama" },
      { value: 3, label: "Tinggal bersama keluarga" },
      { value: 4, label: "Lainnya" },
    ],
  },
};

const TAB_LABELS: Record<TabKey, string> = {
  academic: "Profil Akademik",
  demographics: "Demografi",
  study: "Kebiasaan Belajar",
  social: "Sosial & Dukungan",
};

const TAB_FIELDS: Record<TabKey, StudentField[]> = {
  academic: [
    "course_id",
    "grade_expected",
    "grade_previous",
    "scholarship_type",
    "graduated_h_school_type",
  ],
  demographics: [
    "age",
    "sex",
    "siblings",
    "parental_status",
    "partner",
    "mother_ed",
    "farther_ed",
    "mother_occup",
    "father_occup",
  ],
  study: [
    "weekly_study_hours",
    "reading_non_scientific",
    "reading_scientific",
    "attendances_classes",
    "attendance_seminars_dep",
    "impact_of_projects",
    "preparation_midterm_company",
    "preparation_midterm_time",
    "taking_notes",
    "listenning",
    "discussion_improves_interest",
  ],
  social: [
    "additional_work",
    "activity",
    "total_salary",
    "transport",
    "accomodation",
  ],
};

const DEMOGRAPHIC_COLUMN_FIELDS: Record<"left" | "right", StudentField[]> = {
  left: ["age", "sex", "siblings", "partner"],
  right: ["parental_status", "mother_ed", "farther_ed", "mother_occup", "father_occup"],
};

const HIDDEN_FIELD_DEFAULTS: Partial<Record<StudentField, number>> = {
  flip_classrom: 3,
};

// Template form kosong (semua field "") — deterministik & aman untuk hidrasi SSR.
// Memakai kunci dari generateRandomStudent() agar struktur field tetap satu sumber.
const emptyStudent = (): StudentFormData => {
  const cleared = {} as StudentFormData;
  for (const key of Object.keys(generateRandomStudent()) as StudentField[]) {
    cleared[key] = HIDDEN_FIELD_DEFAULTS[key] ?? "";
  }
  return cleared;
};

// Penjelasan/Saran Akademik per tingkat (3 kelas: Rendah / Sedang / Tinggi)
const IPK_EXPLANATION: Record<number, string> = {
  0: "Mahasiswa diprediksi berada di tingkat RENDAH (estimasi IPK < 2.00) dan berisiko tidak lulus dengan baik. Diperlukan intervensi akademik: kelas remedial, evaluasi ulang kebiasaan belajar, dan bimbingan konseling/tutor sebaya yang intensif.",
  1: "Mahasiswa diprediksi berada di tingkat SEDANG (estimasi IPK 2.00 - 3.49). Sudah di jalur lulus, namun masih banyak ruang perbaikan. Dorong peningkatan kehadiran, diskusi yang lebih aktif, jadwal belajar mingguan yang disiplin, dan lebih banyak membaca jurnal ilmiah.",
  2: "Mahasiswa diprediksi berada di tingkat TINGGI (estimasi IPK >= 3.50). Performa akademik sangat baik. Pertahankan konsistensi dan dorong untuk mengambil peluang magang, asisten peneliti, atau kompetisi akademik untuk menambah portofolio.",
};

// Mapping prediksi numerik ke label tingkat
const IPK_MAP: Record<number, string> = {
  0: "Rendah / Berisiko (IPK < 2.00)",
  1: "Sedang / Cukup (IPK 2.00 - 3.49)",
  2: "Tinggi / Berprestasi (IPK >= 3.50)",
};

export default function Home() {
  const [theme, setTheme] = useState("light");
  const [apiConnected, setApiConnected] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("random_forest.pkl");

  const [activeTab, setActiveTab] = useState<TabKey>("academic");
  // Mulai dengan semua field kosong ("") — initializer lazy ini deterministik
  // sehingga render server & klien identik (tidak ada mismatch hidrasi).
  const [formData, setFormData] = useState<StudentFormData>(emptyStudent);

  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<{
    prediction: number;
    probabilities: Record<string, number> | null;
    model_used: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // ──────────────────────────── driver.js tour ────────────────────────────
  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayColor: "rgba(0,0,0,0.55)",
      stagePadding: 8,
      stageRadius: 10,
      popoverClass: "driverjs-theme",
      nextBtnText: "Lanjut",
      prevBtnText: "Kembali",
      doneBtnText: "Selesai",
      progressText: "Langkah {{current}} dari {{total}}",
      steps: [
        {
          element: "#header-area",
          popover: {
            title: "Selamat Datang!",
            description:
              "Ini adalah Auditor Kelulusan Mahasiswa. Sistem ini memprediksi estimasi IPK mahasiswa berdasarkan data profil dan kebiasaan belajar menggunakan model machine learning.",
          },
        },
        {
          element: "#status-pill",
          popover: {
            title: "Status Koneksi API",
            description:
              "Indikator ini menunjukkan apakah server backend FastAPI sedang aktif dan terhubung. Jika terputus, pastikan backend berjalan di port 8000.",
          },
        },
        {
          element: "#theme-toggle",
          popover: {
            title: "Ganti Tema",
            description: "Klik tombol ini untuk beralih antara mode terang dan mode gelap sesuai preferensi tampilan Anda.",
          },
        },
        {
          element: "#header-area",
          popover: {
            title: "Selamat Datang di Auditor IPK! <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-4px;margin-left:2px'><path d='M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2'/><path d='M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2'/><path d='M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8'/><path d='M18 8a2 2 0 0 1 2-2 2 2 0 0 1 2 2v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15'/></svg>",
            description: "Aplikasi ini membantu Anda memprediksi estimasi nilai IPK kelulusan mahasiswa berdasarkan profil akademik, demografi, dan kebiasaan belajar mereka menggunakan teknologi Machine Learning cerdas.",
          },
        },
        {
          element: "#form-card",
          popover: {
            title: "1. Formulir Profil Mahasiswa",
            description: "Di area utama ini, Anda akan memasukkan data metrik mahasiswa. Semakin akurat data yang diisi, semakin presisi hasil prediksi yang akan diberikan oleh sistem.",
          },
        },
        {
          element: "#tabs-area",
          popover: {
            title: "2. Kategori Data (Tab)",
            description: "Data sangat banyak, jadi kami membaginya ke dalam 4 Tab: Profil Akademik, Demografi, Kebiasaan Belajar, dan Sosial. Pastikan Anda mengklik dan mengecek setiap tab agar tidak ada data yang terlewat!",
          },
        },
        {
          element: "#prefill-btn",
          popover: {
            title: "3. Mode Simulasi (Data Contoh)",
            description: "Malas mengisi puluhan kolom secara manual? Tenang! Klik tombol ini untuk otomatis mengisi form dengan data simulasi acak yang sangat berguna untuk pengujian cepat.",
          },
        },
        {
          element: "#clear-btn",
          popover: {
            title: "4. Reset Data",
            description: "Jika Anda ingin memulai dari kertas kosong, tekan tombol merah ini untuk menghapus seluruh isian form secara instan. Awas, tombol ini menghapus data di semua tab!",
          },
        },
        {
          element: "#model-selector",
          popover: {
            title: "5. Pilihan 'Otak' Prediksi",
            description: "Di bawah sini Anda bisa memilih algoritma Machine Learning spesifik (seperti XGBoost, Random Forest) yang bertugas menjadi 'otak' perhitungannya. Tiap model punya karakteristik akurasi yang berbeda.",
          },
        },
        {
          element: "#predict-btn",
          popover: {
            title: "6. Eksekusi Prediksi! <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-4px;margin-left:2px'><path d='M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z'/><path d='M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z'/><path d='M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0'/><path d='M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5'/></svg>",
            description: "Sudah yakin semua form terisi? Klik tombol ini untuk menjalankan sihir Machine Learning! Sistem akan menganalisis data Anda secara real-time.",
          },
        },
        {
          element: "#result-card",
          popover: {
            title: "7. Panel Hasil & Rekomendasi",
            description: "Voila! Hasilnya akan muncul di kotak kanan ini. Anda tidak hanya akan melihat kelompok IPK, tapi juga probabilitas kepastian model dan rekomendasi akademik khusus untuk mahasiswa tersebut.",
          },
        },
      ],
    });

    driverObj.drive();
  };

  // ──────────────────────────── lifecycle ────────────────────────────
  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch(`${API_BASE}/`);
        if (res.ok) {
          setApiConnected(true);
          const modelsRes = await fetch(`${API_BASE}/models`);
          if (modelsRes.ok) {
            const data = await modelsRes.json();
            setModels(data.models || []);
            if (data.models && data.models.length > 0) {
              setSelectedModel(data.models[0]);
            }
          }
        } else {
          setApiConnected(false);
        }
      } catch {
        setApiConnected(false);
      }
    }
    checkStatus();
  }, []);

  const handleInputChange = (field: StudentField, val: number | "") => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handlePredict = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validasi form: pastikan tidak ada yang kosong
    const emptyFields = (Object.keys(formData) as StudentField[]).filter((key) => formData[key] === "");
    if (emptyFields.length > 0) {
      const firstEmptyField = emptyFields[0];
      const visibleEmptyFields = emptyFields.slice(0, 8);

      setActiveTab(FIELD_CONFIG[firstEmptyField].tab);
      setShowValidationErrors(true);
      setPredictionResult(null);
      setError(null);

      const missingList = visibleEmptyFields
        .map((field) => {
          const config = FIELD_CONFIG[field];
          return `<li><strong>${config.label}</strong> <span style="color:#64748b;">(${TAB_LABELS[config.tab]})</span></li>`;
        })
        .join("");
      const remainingText =
        emptyFields.length > visibleEmptyFields.length
          ? `<p style="margin:8px 0 0;color:#64748b;">Dan ${emptyFields.length - visibleEmptyFields.length} field wajib lainnya.</p>`
          : "";

      await Swal.fire({
        icon: "warning",
        title: "Data belum lengkap",
        html: `
          <p style="margin:0 0 10px;">Isi semua field bertanda <strong style="color:#ef4444;">*</strong> sebelum memulai prediksi.</p>
          <ul style="margin:0;text-align:left;line-height:1.6;">${missingList}</ul>
          ${remainingText}
        `,
        confirmButtonText: "Lengkapi Form",
        confirmButtonColor: "#4f46e5",
      });
      return;
    }

    const invalidRangeFields = (Object.keys(formData) as StudentField[]).filter((key) => {
      const config = FIELD_CONFIG[key];
      const value = formData[key];
      return (
        config.numberInput &&
        typeof value === "number" &&
        (value < config.numberInput.min || value > config.numberInput.max)
      );
    });

    if (invalidRangeFields.length > 0) {
      const firstInvalidField = invalidRangeFields[0];
      const config = FIELD_CONFIG[firstInvalidField];

      setActiveTab(config.tab);
      setShowValidationErrors(true);
      setPredictionResult(null);
      setError(null);

      await Swal.fire({
        icon: "warning",
        title: "Angka di luar batas",
        html: `
          <p style="margin:0;">
            <strong>${config.label}</strong> harus diisi antara
            <strong>${config.numberInput?.min}</strong> sampai
            <strong>${config.numberInput?.max}</strong>.
          </p>
        `,
        confirmButtonText: "Perbaiki",
        confirmButtonColor: "#4f46e5",
      });
      return;
    }

    setLoading(true);
    setError(null);
    setShowValidationErrors(false);
    setPredictionResult(null);

    try {
      const res = await fetch(
        `${API_BASE}/predict?model_name=${selectedModel}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Gagal melakukan prediksi.");
      }

      const data = await res.json();
      setPredictionResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  const handlePreFill = () => {
    setFormData(generateRandomStudent());
    setError(null);
    setShowValidationErrors(false);
    setPredictionResult(null);
  };

  const handleClear = () => {
    setFormData(emptyStudent());
    setPredictionResult(null);
    setError(null);
    setShowValidationErrors(false);
  };

  const renderNumberField = (field: StudentField) => {
    const config = FIELD_CONFIG[field];
    const limits = config.numberInput;
    const hasEmptyError = showValidationErrors && formData[field] === "";
    const hasRangeError =
      showValidationErrors &&
      limits &&
      typeof formData[field] === "number" &&
      (formData[field] < limits.min || formData[field] > limits.max);
    const hasError = Boolean(hasEmptyError || hasRangeError);
    const className = [
      styles.input,
      hasError ? styles.inputError : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={styles.fieldGroup} key={field}>
        <label className={styles.label} htmlFor={field}>
          {config.label}
          <span className={styles.requiredMark} aria-hidden="true">*</span>
        </label>
        <input
          id={field}
          type="number"
          className={className}
          value={formData[field]}
          min={limits?.min}
          max={limits?.max}
          step={1}
          inputMode="numeric"
          placeholder={config.placeholder}
          required
          aria-required="true"
          aria-invalid={hasError}
          onChange={(e) => {
            if (!limits || e.target.value === "") {
              handleInputChange(field, "");
              return;
            }

            const nextValue = Number(e.target.value);
            if (Number.isNaN(nextValue)) return;

            const clampedValue = Math.min(
              limits.max,
              Math.max(limits.min, Math.trunc(nextValue))
            );
            handleInputChange(field, clampedValue);
          }}
        />
        {config.helperText && <span className={styles.helperText}>{config.helperText}</span>}
        {hasEmptyError && <span className={styles.errorText}>Wajib diisi.</span>}
        {hasRangeError && limits && (
          <span className={styles.errorText}>
            Nilai harus antara {limits.min} sampai {limits.max}.
          </span>
        )}
      </div>
    );
  };

  const renderSelectField = (field: StudentField) => {
    const config = FIELD_CONFIG[field];
    const hasError = showValidationErrors && formData[field] === "";
    const className = [
      styles.select,
      formData[field] === "" ? styles.selectPlaceholder : "",
      hasError ? styles.inputError : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={styles.fieldGroup} key={field}>
        <label className={styles.label} htmlFor={field}>
          {config.label}
          <span className={styles.requiredMark} aria-hidden="true">*</span>
        </label>
        <select
          id={field}
          className={className}
          value={formData[field]}
          required
          aria-required="true"
          aria-invalid={hasError}
          onChange={(e) => handleInputChange(field, e.target.value === "" ? "" : parseInt(e.target.value))}
        >
          <option value="" disabled>
            {config.placeholder}
          </option>
          {config.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {config.helperText && <span className={styles.helperText}>{config.helperText}</span>}
        {hasError && <span className={styles.errorText}>Wajib diisi.</span>}
      </div>
    );
  };

  const renderFormField = (field: StudentField) => {
    if (FIELD_CONFIG[field].numberInput) return renderNumberField(field);
    return renderSelectField(field);
  };

  // ──────────────────────────── render ────────────────────────────
  return (
    <div className={styles.container}>
      {/* ───── Header ───── */}
      <header className={styles.header} id="header-area">
        <div className={styles.titleArea}>
          <h1>Auditor Kelulusan Mahasiswa</h1>
          <p>
            Prediksi estimasi IPK kelulusan mahasiswa menggunakan model machine
            learning
          </p>
        </div>
        <div className={styles.metaActions}>
          <div
            id="status-pill"
            className={`${styles.statusPill} ${apiConnected ? styles.connected : ""}`}
          >
            <span className={styles.statusIndicator}></span>
            {apiConnected ? "API Terhubung" : "API Terputus"}
          </div>
          <button
            id="tour-btn"
            className={`${styles.btn} ${styles.btnSecondary}`}
            style={{ padding: "0.375rem 0.75rem", fontSize: "0.75rem" }}
            onClick={startTour}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            Panduan Fitur
          </button>
          <button
            id="theme-toggle"
            className={styles.themeBtn}
            onClick={toggleTheme}
            aria-label="Ganti Tema"
          >
            {theme === "light" ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            )}
          </button>
        </div>
      </header>

      {/* ───── Main Grid ───── */}
      <div className={styles.grid}>
        {/* ── Left: Form ── */}
        <div className={styles.card} id="form-card">
          <div className={styles.cardTitle}>
            <span>Prediksi IPK Kelulusan</span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                id="prefill-btn"
                className={`${styles.btn} ${styles.btnSecondary}`}
                style={{ padding: "0.25rem 0.75rem", fontSize: "0.75rem" }}
                onClick={handlePreFill}
              >
                Gunakan Data Contoh
              </button>
              <button
                id="clear-btn"
                className={`${styles.btn} ${styles.btnDanger}`}
                style={{ padding: "0.25rem 0.75rem", fontSize: "0.75rem" }}
                onClick={handleClear}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                Kosongkan Form
              </button>
            </div>
          </div>

          <div className={styles.tabs} id="tabs-area">
            <button className={`${styles.tabBtn} ${activeTab === "academic" ? styles.active : ""}`} onClick={() => setActiveTab("academic")}>Profil Akademik</button>
            <button className={`${styles.tabBtn} ${activeTab === "demographics" ? styles.active : ""}`} onClick={() => setActiveTab("demographics")}>Demografi</button>
            <button className={`${styles.tabBtn} ${activeTab === "study" ? styles.active : ""}`} onClick={() => setActiveTab("study")}>Kebiasaan Belajar</button>
            <button className={`${styles.tabBtn} ${activeTab === "social" ? styles.active : ""}`} onClick={() => setActiveTab("social")}>Sosial & Dukungan</button>
          </div>

          <form onSubmit={handlePredict} noValidate>
            {activeTab === "demographics" ? (
              <div className={styles.demographicsGrid}>
                <div className={styles.fieldColumn}>
                  {DEMOGRAPHIC_COLUMN_FIELDS.left.map(renderFormField)}
                </div>
                <div className={styles.fieldColumn}>
                  {DEMOGRAPHIC_COLUMN_FIELDS.right.map(renderFormField)}
                </div>
              </div>
            ) : (
              <div className={styles.formGrid}>
                {TAB_FIELDS[activeTab].map(renderFormField)}
              </div>
            )}

            {/* Action Row */}
            <div className={styles.actionRow}>
              <div className={styles.modelSelectorBox} id="model-selector">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                <label>Model ML:</label>
                <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
                  {models.map((m) => (
                    <option key={m} value={m}>
                      {m.replace(".pkl", "").toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <button
                id="predict-btn"
                type="submit"
                disabled={loading || !apiConnected}
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                {loading ? "Menghitung..." : "Mulai Prediksi"}
              </button>
            </div>
          </form>
        </div>

        {/* ── Right: Results ── */}
        <div className={styles.sidebar}>
          {/* Hasil Prediksi */}
          <div className={styles.card} id="result-card">
            <div className={styles.cardTitle}>Hasil Prediksi IPK</div>

            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 1rem", color: "var(--brand-primary)" }}>
                <svg className={styles.spinner} xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                <div style={{ marginTop: "1rem", fontWeight: "600", color: "var(--text-primary)" }}>Memproses Data...</div>
                <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>Model ML sedang memprediksi IPK kelulusan</div>
              </div>
            ) : predictionResult ? (
              <div className={styles.resultContainer}>
                <IpkGauge value={predictionResult.prediction} />
                <div className={styles.gradeLabel}>
                  {IPK_MAP[predictionResult.prediction] ?? `Kelompok IPK ${predictionResult.prediction}`}
                </div>
                <div className={styles.modelTag}>
                  Model: {predictionResult.model_used}
                </div>

                <div style={{
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  padding: "1rem",
                  marginTop: "0.5rem",
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  lineHeight: "1.5",
                  textAlign: "left"
                }}>
                  <div style={{ fontWeight: "600", color: "var(--text-primary)", marginBottom: "0.375rem" }}>
                    Analisis & Rekomendasi:
                  </div>
                  {IPK_EXPLANATION[predictionResult.prediction] ?? "Tidak ada data penjelasan untuk kelompok ini."}
                </div>

                {predictionResult.probabilities && (
                  <div style={{ width: "100%", marginTop: "0.5rem" }}>
                    <div style={{ fontSize: "0.8125rem", fontWeight: "600", marginBottom: "0.25rem", color: "var(--text-secondary)" }}>Distribusi Probabilitas per Kelompok IPK:</div>
                    <ProbabilityBarChart probabilities={predictionResult.probabilities} />
                  </div>
                )}
              </div>
            ) : error ? (
              <div
                style={{
                  color: "var(--error)",
                  padding: "1rem",
                  backgroundColor: "var(--error-light)",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                }}
              >
                Gagal: {error}
              </div>
            ) : (
              <div className={styles.emptyStateGuide}>
                <div style={{ marginBottom: "1rem", fontWeight: "600", color: "var(--text-primary)", fontSize: "0.95rem" }}>
                  Cara Menggunakan Auditor:
                </div>
                <ol style={{ paddingLeft: "1.25rem", color: "var(--text-secondary)", fontSize: "0.875rem", display: "flex", flexDirection: "column", gap: "0.75rem", margin: 0 }}>
                  <li>Pilih <strong>kategori tab</strong> di sebelah kiri (Akademik, Demografi, dsb).</li>
                  <li>Isi <strong>data profil</strong> mahasiswa sesuai dengan keadaan sebenarnya, atau gunakan tombol <strong>Gunakan Data Contoh</strong>.</li>
                  <li>Pilih <strong>model machine learning</strong> yang ingin digunakan di bagian bawah formulir.</li>
                  <li>Klik tombol <strong>Mulai Prediksi</strong> untuk melihat estimasi IPK kelulusan.</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
