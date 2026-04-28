import "dotenv/config";
import app from "/home/abdelaziz/Desktop/LMS project/lms-grad-project-auth-feature/src/app.js";

const routes = [];
app._router.stack.forEach((middleware) => {
    if (middleware.route) {
        routes.push({
            path: middleware.route.path,
            methods: Object.keys(middleware.route.methods).join(", ").toUpperCase()
        });
    } else if (middleware.name === "router") {
        middleware.handle.stack.forEach((handler) => {
            if (handler.route) {
                const prefix = middleware.regexp.toString().match(/^\/\^\\\/(.*?)\\\/\?\(\?=\\\/|\$\)/);
                const basePath = prefix && prefix[1] ? `/${prefix[1].replace(/\\\//g, "/")}` : "";
                routes.push({
                    path: basePath + handler.route.path,
                    methods: Object.keys(handler.route.methods).join(", ").toUpperCase()
                });
            }
        });
    }
});

console.log("Registered API Endpoints:");
routes.forEach(route => console.log(`${route.methods} ${route.path}`));

process.exit(0);
