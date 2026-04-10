import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchBlogPostBySlug, fetchRecentBlogPosts, getBlogShareImage } from '@/services/blog.service';
import { BlogThemeWrapper } from '@/components/blog/BlogThemeWrapper';
import BlogPostContent from '@/components/blog/BlogPostContent';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await fetchBlogPostBySlug(params.slug);
  const socialImage = getBlogShareImage(post);

  if (!post) {
    return {
      title: 'Post no encontrado | Lookitry',
    };
  }

  return {
    title: `${post.title} | Lookitry Blog`,
    description: post.meta_description || post.excerpt,
    alternates: {
      canonical: `https://lookitry.com/blog/${params.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.meta_description || post.excerpt,
      images: socialImage ? [socialImage] : [],
      type: 'article',
      publishedTime: post.published_at || post.created_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.meta_description || post.excerpt,
      images: socialImage ? [socialImage] : [],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await fetchBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const recentPosts = await fetchRecentBlogPosts(3, post.slug);
  const shareUrl = `https://lookitry.com/blog/${params.slug}`;

  return (
    <BlogThemeWrapper>
      <BlogPostContent 
        post={post} 
        recentPosts={recentPosts} 
        shareUrl={shareUrl} 
      />
    </BlogThemeWrapper>
  );
}
