import { useFormik } from 'formik';
import { Link } from 'react-router-dom';
import * as Yup from 'yup';
import axios from 'axios';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Required'),
  password: Yup.string()
    .required('Required')
    // .matches(
    //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&^])[A-Za-z\d@.#$!%*?&]{8,15}$/,
    //   'Password must contain at least one lowercase, uppercase, digit, special character, and be 8-15 characters long'
    // ),
});

const LoginPage = () => {
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        const response = await axios.post('http://127.0.0.1:8000/api/user/login/', values);
        alert('Login successful');
        console.log(response.data);
      } catch (error) {
        if (error.response && error.response.data) {
          const errorMessages = error.response;
          formik.setErrors({
            ...formik.errors,
            password: errorMessages.password ? errorMessages.password[0] : null,
          });
        } else {
          alert('Login failed');
        }
        console.error(error); // Handle errors as needed
      }
    },
  });

  return (
    <div>
      <section className="bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
          <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">

                    <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                        Login an account
                    </h1>
                    <form onSubmit={formik.handleSubmit}>

                        <div className='pt-4'>
                        <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your email</label>
                        <input 
                            type="email" 
                            name="email" 
                            id="email" 
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                            placeholder="Your email"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.email}
                        />
                        {formik.touched.email && formik.errors.email ? (
                            <div style={{ color: 'red' }}>{formik.errors.email}</div>
                        ) : null}
                        </div>

                        <div className='pt-4'>
                        <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                        <input 
                            type="password" 
                            name="password" 
                            id="password" 
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                            placeholder="Password"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.password}
                        />
                        {formik.touched.password && formik.errors.password ? (
                            <div style={{ color: 'red' }}>{formik.errors.password}</div>
                        ) : null}
                        </div>

                        <div className="flex -mx-3 my-4">
                        <div className="w-full px-3 mb-5">
                            <p className='block w-full max-w-xs mx-auto text-black px-3'>
                                Forgot Password?
                            <Link to="/reset-password-email" className='text-indigo-700'> Forgot Password </Link>
                            </p>
                        </div>
                        </div>

                        <div className="flex -mx-3 my-4">
                        <div className="w-full px-3 mb-5">
                            <p className='block w-full max-w-xs mx-auto text-black px-3'>
                                Do not have an account yet?
                            <Link to="/signup" className='text-indigo-700'> Sign up </Link>
                            </p>
                        </div>
                        </div>

                        <div className="flex -mx-3 mt-4">
                        <div className="w-full px-3">
                            <button
                            type="submit"
                            className="block w-full max-w-xs mx-auto bg-indigo-500 hover:bg-indigo-700 focus:bg-indigo-700 text-white rounded-lg px-3 py-3 font-semibold"
                            disabled={!formik.isValid}
                            >
                            Login
                            </button>
                        </div>
                        </div>

                    </form>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LoginPage;