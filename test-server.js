import express from 'express';
import toolRoutes from './src/routes/toolRoutes.js';

const app = express();
app.use('/', toolRoutes);

app.use((err, req, res, next) => {
  console.error("EXPRESS ERROR HANDLER CAUGHT:", err);
  res.status(500).send("Error");
});

app.listen(3001, () => {
  console.log("Test server running on 3001");
});
