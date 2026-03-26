const errorMiddleware = (err, req, res, next) => {
    console.error("[ParkX BE][ErrorMiddleware]", {
        method: req.method,
        path: req.originalUrl,
        userId: req.userId || null,
        message: err?.message,
        code: err?.code,
        stack: err?.stack,
    });


    if (err.code === "23505") {
        return res.status(409).json({
            success: false,
            message: "Resource already exists"
        });
    }

    return res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
};

export default errorMiddleware;
