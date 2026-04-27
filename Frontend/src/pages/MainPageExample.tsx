import NavBar from '../components/NavBar';

const MainPageExample = () => {
  return (
    <div className="min-h-screen bg-transparent">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Bienvenido a Proyecto Trasteros
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Has iniciado sesión correctamente. Utiliza la barra de navegación superior para gestionar tus trasteros.
          </p>
        </div>
      </main>
    </div>
  );
};

export default MainPageExample;
