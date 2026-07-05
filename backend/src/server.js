const express = require("express");

const app = express();

app.use(express.json());

app.use("/api/health", require("./routes/health"));

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {

    console.log(`Backend iniciado en puerto ${PORT}`);

});