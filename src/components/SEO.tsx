import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description = "Bidhora - The premier platform for professional digital solutions in Sri Lanka. Find experts in Web Development, Graphic Design, Academic Writing, and more.",
  keywords = "digital solutions, sri lanka, web development, graphic design, academic writing, hire professionals, online jobs, bidhora",
  image = "https://firebasestorage.googleapis.com/v0/b/bidhora.firebasestorage.app/o/Logo%2FFrame%203%20(2).png?alt=media&token=4a43ddaa-dd64-4d54-a833-1f7615084b72",
  url = window.location.href,
  type = "website"
}) => {
  const siteTitle = "Bidhora";
  const fullTitle = title === siteTitle ? title : `${title} | ${siteTitle}`;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />

      {/* Open Graph tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEO;
