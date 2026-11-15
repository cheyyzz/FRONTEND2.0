import { Link } from 'react-router-dom';
import { ArrowRight, BookCheck, Compass, GraduationCap, Target } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getDefaultRouteForRole } from '../utils/authValidation';

interface ImprovementHighlight {
  index: string;
  title: string;
  description: string;
  metricLabel: string;
}

const IMPROVEMENT_HIGHLIGHTS: ImprovementHighlight[] = [
  {
    index: '01',
    title: 'Kuis Dibuat oleh Dosen',
    description:
      'Dosen menyusun soal pilihan ganda, menentukan jawaban benar, dan menerbitkan kuis untuk mahasiswa.',
    metricLabel: 'Soal, opsi jawaban, kunci, dan pembahasan',
  },
  {
    index: '02',
    title: 'Mahasiswa Mengerjakan Kuis',
    description:
      'Mahasiswa dapat melihat kuis yang diterbitkan dosen dan mengirim jawaban dari dashboard.',
    metricLabel: 'Kuis tersedia setelah diterbitkan',
  },
  {
    index: '03',
    title: 'Skor dan Pembahasan',
    description:
      'Setelah mengirim jawaban, mahasiswa melihat skor, jawaban benar, dan pembahasan yang disediakan dosen.',
    metricLabel: 'Hasil tampil setelah pengerjaan dikirim',
  },
  {
    index: '04',
    title: 'Kelas sebagai Fitur Tambahan',
    description:
      'Kode kelas membantu dosen mengelompokkan mahasiswa, tetapi tidak diperlukan untuk mengerjakan kuis.',
    metricLabel: 'Kuis terbit dapat diakses semua mahasiswa',
  },
];

/**
 * Public landing page introducing OnlineQuiz and its SRL-aligned capabilities.
 */
export function LandingPage() {
  const { userProfile, firebaseUid } = useAuth();
  const primaryDestination =
    firebaseUid && userProfile ? getDefaultRouteForRole(userProfile.role) : '/login';

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      {/* Hero section */}
      <section className="grid items-center gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="text-xs font-semibold tracking-wide text-sky-700">
            Platform Kuis Perkuliahan · React + TypeScript + Firebase
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Dosen Membuat Kuis. Mahasiswa Mengerjakan dan Memahami Hasilnya.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
            Dosen membuat dan menerbitkan soal pilihan ganda. Mahasiswa mengerjakan kuis, lalu melihat
            skor serta pembahasan setelah mengirim jawaban. Kelas dan kode bergabung tersedia sebagai
            fitur tambahan.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to={primaryDestination}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            >
              <span>{firebaseUid ? 'Buka Dashboard' : 'Masuk atau Daftar'}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href="#arsitektur-srl"
              className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Pelajari Fitur Utama
            </a>
          </div>
        </div>

        {/* Right summary panel (single-level elevation, no nested cards) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5">
          <h2 className="text-base font-bold text-slate-900">Alur Kuis</h2>
          <p className="mt-1 text-sm text-slate-600">
            Dari penyusunan soal oleh dosen sampai hasil pengerjaan mahasiswa.
          </p>

          <dl className="mt-6 divide-y divide-slate-200">
            <div className="flex items-start gap-3 py-3.5 first:pt-0">
              <Compass className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" aria-hidden="true" />
              <div>
                <dt className="text-sm font-semibold text-slate-900">1. Dosen Membuat Kuis</dt>
                <dd className="text-xs leading-relaxed text-slate-600">
                  Susun soal pilihan ganda dan tentukan kunci jawaban serta pembahasannya.
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3 py-3.5">
              <Target className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" aria-hidden="true" />
              <div>
                <dt className="text-sm font-semibold text-slate-900">2. Mahasiswa Mengerjakan</dt>
                <dd className="text-xs leading-relaxed text-slate-600">
                  Pilih kuis yang sudah diterbitkan dan kirim jawaban dari dashboard mahasiswa.
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3 py-3.5">
              <BookCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" aria-hidden="true" />
              <div>
                <dt className="text-sm font-semibold text-slate-900">3. Lihat Hasil</dt>
                <dd className="text-xs leading-relaxed text-slate-600">
                  Skor dan pembahasan muncul setelah seluruh jawaban dikirim.
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3 py-3.5 last:pb-0">
              <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
              <div>
                <dt className="text-sm font-semibold text-slate-900">Kelas Opsional</dt>
                <dd className="text-xs leading-relaxed text-slate-600">
                  Kode kelas membantu mengelompokkan mahasiswa tanpa menjadi syarat mengerjakan kuis.
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </section>

      {/* Four improvements section */}
      <section id="arsitektur-srl" className="mt-16 border-t border-slate-200 pt-12">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Fitur Utama OnlineQuiz
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Kuis dibuat oleh dosen dan dikerjakan oleh mahasiswa; kelas hanya fitur tambahan.
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {IMPROVEMENT_HIGHLIGHTS.map((item) => (
            <article
              key={item.index}
              className="rounded-xl border border-slate-200 bg-white p-6"
            >
              <p className="font-mono text-xs font-semibold text-sky-700 tabular-nums">
                {item.index}. Kontribusi Terukur
              </p>
              <h3 className="mt-2 text-base font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
              <p className="mt-4 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">
                {item.metricLabel}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
