import Image from 'next/image';

export default function Header() {
  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <div className="p-7 rounded-lg bg-gray-50">
      <div>
        <h1 className="text-3xl font-bold flex items-center -ml-1">
          <span className="mr-1">
            <Image
              src="/images/logo.png"
              alt="Scurry Logo"
              width={36}
              height={36}
              style={{ display: 'inline', verticalAlign: 'middle', height: 36 }}
              priority
              unoptimized
            />
          </span>
          <span className="text-gray-800">Scurry</span>
        </h1>
        <p className="mt-2 text-gray-500">A nimble little mouse that scurries through MyAnonamouse (MAM) and whisks books & audiobooks into qBittorrent</p>
        <button
          onClick={handleLogout}
          className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded cursor-pointer"
        >
          Logout
        </button>
      </div>
    </div>
  );
}