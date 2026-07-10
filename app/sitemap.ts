import { MetadataRoute } from 'next';
import Blog from '@/models/Blog';
import connectDB from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectDB();
  
  // Fetch all published blogs from your database
  const blogs = await Blog.find({ is_published: true }).lean();

  const blogEntries: MetadataRoute.Sitemap = blogs.map((blog: any) => ({
    url: `https://tut-dev.vercel.app/blog/${blog._id}`,
    lastModified: new Date(blog.last_saved_at || blog.created_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [
    {
      url: 'https://tut-dev.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...blogEntries,
  ];
}