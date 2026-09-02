import type { NilaiCode } from "./scoring";

export const PANDUAN: Array<{
  nilaiDasarId: string;
  sequence: number;
  title: string;
}> = [
  { nilaiDasarId: "nilai_bp", sequence: 1, title: "Memahami dan memenuhi kebutuhan masyarakat" },
  { nilaiDasarId: "nilai_bp", sequence: 2, title: "Ramah, cekatan, solutif, dan dapat diandalkan" },
  { nilaiDasarId: "nilai_bp", sequence: 3, title: "Melakukan perbaikan tiada henti" },
  { nilaiDasarId: "nilai_ak", sequence: 1, title: "Melaksanakan tugas dengan jujur, bertanggung jawab, cermat, disiplin, dan berintegritas tinggi" },
  { nilaiDasarId: "nilai_ak", sequence: 2, title: "Menggunakan kekayaan dan BMN secara bertanggung jawab, efektif, dan efisien" },
  { nilaiDasarId: "nilai_ak", sequence: 3, title: "Tidak menyalahgunakan kewenangan jabatan" },
  { nilaiDasarId: "nilai_kp", sequence: 1, title: "Meningkatkan kompetensi diri untuk menjawab tantangan yang selalu berubah" },
  { nilaiDasarId: "nilai_kp", sequence: 2, title: "Membantu orang lain belajar" },
  { nilaiDasarId: "nilai_kp", sequence: 3, title: "Melaksanakan tugas dengan kualitas terbaik" },
  { nilaiDasarId: "nilai_hm", sequence: 1, title: "Menghargai setiap orang tanpa membedakan latar belakang" },
  { nilaiDasarId: "nilai_hm", sequence: 2, title: "Suka menolong" },
  { nilaiDasarId: "nilai_hm", sequence: 3, title: "Membangun lingkungan kerja yang kondusif" },
  { nilaiDasarId: "nilai_ly", sequence: 1, title: "Memegang teguh ideologi Pancasila, UUD Negara RI Tahun 1945, setia kepada NKRI, dan pemerintahan yang sah" },
  { nilaiDasarId: "nilai_ly", sequence: 2, title: "Menjaga nama baik ASN, instansi, dan negara" },
  { nilaiDasarId: "nilai_ly", sequence: 3, title: "Menjaga rahasia jabatan dan negara" },
  { nilaiDasarId: "nilai_ad", sequence: 1, title: "Cepat menyesuaikan diri menghadapi perubahan" },
  { nilaiDasarId: "nilai_ad", sequence: 2, title: "Terus berinovasi dan mengembangkan kreativitas" },
  { nilaiDasarId: "nilai_ad", sequence: 3, title: "Bertindak proaktif" },
  { nilaiDasarId: "nilai_kb", sequence: 1, title: "Memberi kesempatan kepada berbagai pihak untuk berkontribusi" },
  { nilaiDasarId: "nilai_kb", sequence: 2, title: "Terbuka dalam bekerja sama untuk menghasilkan nilai tambah" },
  { nilaiDasarId: "nilai_kb", sequence: 3, title: "Menggerakkan pemanfaatan berbagai sumber daya untuk tujuan bersama" },
];

export const ANCHORS: Record<NilaiCode, [string, string, string, string, string]> = {
  BP: [
    "Membiarkan keluhan masyarakat/pengguna layanan tidak ditindaklanjuti hingga berlarut-larut.",
    "Melayani sesuai jam kerja formal tanpa berusaha memahami kebutuhan sebenarnya dari masyarakat yang dilayani.",
    "Menyelesaikan permintaan layanan sesuai standar prosedur yang berlaku, namun baru bertindak setelah diminta.",
    "Menindaklanjuti keluhan atau kebutuhan masyarakat dengan cepat dan memberikan solusi yang tepat tanpa diminta berulang kali.",
    "Mengusulkan dan menerapkan perbaikan layanan atas inisiatif sendiri berdasarkan masukan masyarakat, sebelum diminta oleh atasan.",
  ],
  AK: [
    "Menggunakan fasilitas/aset kantor untuk kepentingan pribadi di luar peruntukannya.",
    "Menyelesaikan tugas dengan hasil yang tidak sesuai standar karena kurang teliti dalam bekerja.",
    "Menyelesaikan tugas sesuai batas waktu dan aturan yang ditetapkan tanpa perlu diawasi ketat.",
    "Melaporkan penggunaan anggaran/aset secara transparan dan tepat waktu sesuai ketentuan yang berlaku.",
    "Mengingatkan atau menegur rekan kerja yang menyalahgunakan wewenang/aset, meski berisiko tidak populer.",
  ],
  KP: [
    "Menolak mengikuti pelatihan atau kegiatan pengembangan kompetensi yang ditugaskan.",
    "Mengerjakan tugas dengan cara lama meski sudah tidak sesuai kebutuhan pekerjaan saat ini.",
    "Mengikuti pelatihan/tugas belajar yang diwajibkan dan menerapkannya pada pekerjaan sehari-hari.",
    "Mempelajari keterampilan baru secara mandiri untuk menyelesaikan tugas yang belum pernah dikerjakan sebelumnya.",
    "Membimbing/melatih rekan kerja lain hingga rekan tersebut mampu menyelesaikan tugas secara mandiri.",
  ],
  HM: [
    "Membeda-bedakan perlakuan kepada rekan kerja berdasarkan suku, agama, atau golongan tertentu.",
    "Membiarkan rekan kerja kesulitan menyelesaikan tugas tanpa menawarkan bantuan.",
    "Bersedia membantu rekan kerja yang meminta bantuan secara langsung.",
    "Menawarkan bantuan kepada rekan kerja yang kesulitan tanpa diminta terlebih dahulu.",
    "Menjadi penengah saat terjadi perselisihan antar rekan kerja hingga situasi kembali kondusif.",
  ],
  LY: [
    "Menyebarkan informasi rahasia instansi kepada pihak yang tidak berwenang.",
    "Menyampaikan keluhan tentang kebijakan instansi di media sosial atau ruang publik.",
    "Menjalankan kebijakan dan arahan pimpinan yang sah sesuai aturan yang berlaku.",
    "Menjaga kerahasiaan data/dokumen negara sesuai dengan tingkat kerahasiaannya.",
    "Membela nama baik instansi secara aktif ketika instansi mendapat kritik yang tidak berdasar di ruang publik.",
  ],
  AD: [
    "Menolak menjalankan cara kerja atau sistem baru yang ditetapkan instansi.",
    "Menjalankan sistem/cara kerja baru hanya setelah diperintahkan berulang kali oleh atasan.",
    "Menyesuaikan diri dengan perubahan kebijakan atau sistem kerja dalam waktu yang wajar.",
    "Mengusulkan cara atau ide baru untuk menyelesaikan pekerjaan lebih efektif dari sebelumnya.",
    "Menjadi pihak pertama yang mencoba dan menerapkan sistem/teknologi baru sebelum diwajibkan, lalu membagikannya ke rekan kerja.",
  ],
  KB: [
    "Menolak bekerja sama dengan unit atau pihak lain meski dibutuhkan untuk penyelesaian tugas.",
    "Bekerja sama dengan pihak lain hanya jika ditugaskan secara langsung oleh atasan.",
    "Berkontribusi aktif dalam tim lintas unit sesuai tugas yang diberikan.",
    "Mengajak pihak lain (unit/instansi) untuk terlibat dalam penyelesaian pekerjaan bersama.",
    "Membangun kerja sama/kemitraan baru dengan pihak lain yang menghasilkan manfaat nyata bagi organisasi.",
  ],
};

export const FEEDBACKS: Record<NilaiCode, [string, string, string, string, string]> = {
  BP: [
    "Segera tindak lanjuti setiap keluhan masyarakat/pengguna layanan maksimal 1x24 jam, jangan dibiarkan berlarut-larut.",
    "Pahami kebutuhan nyata masyarakat, jangan sekadar menjalankan prosedur formal.",
    "Sudah sesuai standar; tingkatkan dengan lebih berinisiatif tanpa menunggu diminta.",
    "Pertahankan respons yang cepat dan solutif ini secara konsisten.",
    "Pertahankan dan tularkan inisiatif perbaikan layanan ini ke rekan kerja.",
  ],
  AK: [
    "Hentikan penggunaan aset kantor di luar peruntukannya; patuhi aturan BMN.",
    "Tingkatkan ketelitian kerja dengan membiasakan cek ulang sebelum menyerahkan hasil.",
    "Sudah disiplin; lebih proaktif melaporkan penggunaan sumber daya tanpa diminta.",
    "Pertahankan transparansi dan ketepatan waktu pelaporan ini.",
    "",
  ],
  KP: [
    "Ikuti pelatihan yang ditugaskan dengan sikap terbuka untuk mengembangkan diri.",
    "Perbarui cara kerja sesuai kebutuhan terkini, jangan bertahan di cara lama.",
    "Sudah baik menerapkan pelatihan; mulai belajar mandiri tanpa menunggu penugasan.",
    "Pertahankan belajar mandiri ini dan mulai bagikan ke rekan kerja.",
    "Pertahankan peran sebagai mentor bagi rekan kerja.",
  ],
  HM: [
    "Hentikan sikap membeda-bedakan rekan kerja; perlakukan semua secara setara.",
    "Biasakan menawarkan bantuan saat melihat rekan kerja kesulitan.",
    "Sudah bersedia membantu; lebih peka tanpa harus diminta dulu.",
    "Pertahankan kepekaan menawarkan bantuan secara proaktif ini.",
    "Pertahankan peran sebagai penengah yang menjaga keharmonisan tim.",
  ],
  LY: [
    "Hentikan segera membocorkan informasi rahasia instansi; jaga kerahasiaannya.",
    "Sampaikan keluhan kebijakan lewat saluran internal, bukan di ruang publik.",
    "Sudah patuh pada kebijakan; tingkatkan kedisiplinan menjaga kerahasiaan data.",
    "Pertahankan kedisiplinan menjaga kerahasiaan data ini secara konsisten.",
    "Pertahankan keberanian membela nama baik instansi secara santun dan berbasis fakta.",
  ],
  AD: [
    "Bersikap terbuka terhadap perubahan sistem kerja, jangan menolaknya.",
    "Segera terapkan perubahan begitu diinformasikan, tanpa menunggu diingatkan berulang.",
    "Sudah cukup adaptif; mulai berani usulkan ide perbaikan, bukan hanya menyesuaikan diri.",
    "Pertahankan inisiatif usulan ide baru ini dan coba terapkan bertahap.",
    "Pertahankan semangat menjadi pelopor inovasi dan berbagi ke rekan kerja.",
  ],
  KB: [
    "Bersikap terbuka untuk bekerja sama saat dibutuhkan pihak lain.",
    "Tawarkan diri terlibat kerja sama lintas unit, jangan menunggu ditugaskan.",
    "Sudah berkontribusi baik; mulai ambil inisiatif mengajak pihak lain terlibat.",
    "Pertahankan inisiatif mengajak kolaborasi ini dan jajaki kemitraan lebih luas.",
    "Pertahankan kemampuan membangun kemitraan strategis dan bagikan strateginya ke rekan kerja.",
  ],
};
