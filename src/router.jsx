import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Signup from "./components/Signup";
import Signin from "./components/Signin";
import Dashboard from "./components/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import Home from "./pages/Home";
import ItemDetail from "./pages/ItemDetail";
import CreateItem from "./pages/CreateItem";
import MyItems from "./pages/MyItems";
import BorrowRequests from "./pages/BorrowRequests";
import Layout from "./components/Layout";

export const router = createBrowserRouter([
    {
        element: <Layout />,
        children: [
            { path: "/", element: <Home />},
            { path: "/signup", element: <Signup />},
            { path: "/signin", element: <Signin />},
            { path: "/items/:id", element: <ItemDetail />},
            { 
                path: "/dashboard", 
                element: (
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                ),
            },
            {
                path: "/items/new",
                element: (
                    <PrivateRoute>
                        <CreateItem />
                    </PrivateRoute>
                ),
            },
            {
                path: "/my-items",
                element: (
                    <PrivateRoute>
                        <MyItems />
                    </PrivateRoute>
                ),
            },
            {
                path: "/borrow-requests",
                element: (
                    <PrivateRoute>
                        <BorrowRequests />
                    </PrivateRoute>
                ),
            },
        ],
    },
]);