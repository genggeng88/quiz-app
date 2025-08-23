export default function Login() {
    return (
        <div className="flex justify-center items-center h-screen">
            <div className="bg-white p-8 rounded shadow-md w-96">
                <h2 className="text-2xl font-semibold mb-4">Login</h2>
                <form>
                    <input type="email" placeholder="Email" className="input" />
                    <input type="password" placeholder="Password" className="input mt-2" />
                    <button className="btn mt-4 w-full">Login</button>
                </form>
            </div>
        </div>
    );
}