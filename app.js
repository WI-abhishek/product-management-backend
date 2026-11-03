import { expressConfig, dbConnection } from '#configs';

const app = expressConfig();

dbConnection().then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Product Management Server running on port ${PORT}`);
    });
});

