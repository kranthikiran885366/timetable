import Head from "next/head"

export function SEOHead({
  title = "TimetableGen - Smart Timetable Generator",
  description = "Generate optimized timetables for educational institutions with real-time updates and conflict resolution.",
  keywords = "timetable, schedule, education, generator, academic, school, college, university",
  ogImage = "/og-image.png",
  canonical,
}) {
  const fullTitle = title.includes("TimetableGen") ? title : `${title} | TimetableGen`

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="TimetableGen" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="TimetableGen" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

      {/* Theme Color */}
      <meta name="theme-color" content="#000000" />

      {/* Robots */}
      <meta name="robots" content="index, follow" />
    </Head>
  )
}
