import { Link, useNavigate } from "react-router-dom";
import { useAuth } from './contexts/AuthContext.jsx';  // Import AuthContext for managing auth state
import Lottie from 'lottie-react'; // Import Lottie
import animationLogo from '../../Animations/Animation - 1729447323170.json'

function Navbar() {
    const { isAuthenticated, logout } = useAuth();  // Get auth state and logout function
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();  // Call the logout function from context
        localStorage.removeItem('access_token');  // Remove the token from localStorage
        navigate('/login');  // Redirect to login page
    };

    return (
        <>
            <section className="w-full px-8 text-gray-700 bg-white">
                <div className="container flex flex-col flex-wrap items-center justify-between py-5 mx-auto md:flex-row max-w-7xl">
                    <div className="relative flex flex-col md:flex-row">
                        <a href="https://flowbite.com/" className="flex items-center space-x-3 rtl:space-x-reverse">
                            <Lottie animationData={animationLogo} loop={true} style={{ height: '40px' }} />
                            <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">Timer</span>
                        </a>
                        <nav className="flex flex-wrap items-center mb-5 text-base md:mb-0 md:pl-8 md:ml-8 md:border-l md:border-gray-200">
                            <Link to="/" className="mr-5 font-medium leading-6 text-gray-600 hover:text-gray-900">Home</Link>
                            <Link to="/products" className="mr-5 font-medium leading-6 text-gray-600 hover:text-gray-900">Products</Link>
                            <Link to="/pricing" className="mr-5 font-medium leading-6 text-gray-600 hover:text-gray-900">Pricing</Link>
                            <Link to="/contact" className="mr-5 font-medium leading-6 text-gray-600 hover:text-gray-900">Contact Us</Link>
                            <Link to="/todos" className="mr-5 font-medium leading-6 text-gray-600 hover:text-gray-900">Todo</Link>
                        </nav>
                    </div>

                    <div className="inline-flex items-center ml-5 space-x-6 lg:justify-end">
                        {isAuthenticated ? (
                            // Show the logout button if authenticated
                            <button 
                                onClick={handleLogout}
                                className="text-base font-medium leading-6 text-gray-600 whitespace-no-wrap transition duration-150 ease-in-out hover:text-gray-900">
                                Logout
                            </button>
                        ) : (
                            // Show login/signup if not authenticated
                            <>
                                <Link to="/login" className="text-base font-medium leading-6 text-gray-600 whitespace-no-wrap transition duration-150 ease-in-out hover:text-gray-900">
                                    Log in
                                </Link>
                                <Link to="/signup" className="inline-flex items-center justify-center px-4 py-2 text-base font-medium leading-6 text-white whitespace-no-wrap bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600">
                                    Sign up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}

export default Navbar;
