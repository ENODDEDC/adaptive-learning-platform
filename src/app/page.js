import Image from 'next/image'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-900 text-white">
      <h1 className="text-6xl font-bold mb-4">
        Welcome to{' '}
        <a className="text-blue-500 hover:text-blue-400" href="https://nextjs.org">
          Next.js!
        </a>
      </h1>

      <p className="mt-3 text-2xl">
        This project is configured with{' '}
        <code className="p-3 font-mono text-lg bg-gray-800 rounded-md">
          Tailwind CSS v3
        </code>{' '}
        and the App Router.
      </p>

      <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6 sm:w-full">
        <a
          href="https://nextjs.org/docs"
          className="p-6 mt-6 text-left border-2 border-gray-700 w-96 rounded-xl hover:text-blue-500 hover:border-blue-500 focus:text-blue-500 transition-colors"
        >
          <h3 className="text-2xl font-bold">Documentation &rarr;</h3>
          <p className="mt-4 text-xl">
            Find in-depth information about Next.js features and API.
          </p>
        </a>

        <a
          href="https://tailwindcss.com/docs"
          className="p-6 mt-6 text-left border-2 border-gray-700 w-96 rounded-xl hover:text-blue-500 hover:border-blue-500 focus:text-blue-500 transition-colors"
        >
          <h3 className="text-2xl font-bold">Tailwind CSS Docs &rarr;</h3>
          <p className="mt-4 text-xl">
            Explore the official Tailwind CSS documentation.
          </p>
        </a>
      </div>

      <footer className="flex items-center justify-center w-full h-24 border-t border-gray-700 mt-8">
        <a
          className="flex items-center justify-center"
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <Image
            src="/vercel.svg"
            alt="Vercel Logo"
            className="h-4 ml-2"
            width={76}
            height={16}
          />
        </a>
      </footer>
    </div>
  )
}