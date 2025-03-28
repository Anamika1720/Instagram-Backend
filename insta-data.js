import { connect, model, Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

// 1️. Connect to MongoDB
async function connectDB() {
  try {
    await connect("mongodb://127.0.0.1:27017/Insta");
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Connection error:", err);
  }
}

// 2️. Define Insta Schema
const instaSchema = new Schema(
  {
    postId: { type: String, required: true, unique: true },
    caption: { type: String, required: true },
    imageUrl: { type: String, required: true },
    likes: [
      {
        userId: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    comments: [
      {
        userId: { type: String, required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// 3️. Define Mongoose Model
const InstaModel = model("Insta", instaSchema);

// 4. Function to Generate Random Posts
function generateRandomPosts(count) {
  const posts = [];
  for (let i = 0; i < count; i++) {
    posts.push({
      postId: uuidv4(),
      caption: `This is caption ${i + 1}`,
      imageUrl: `https://images.unsplash.com/photo-1742330425089-1f91d18eaa4e?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`,
      likes: [],
      comments: [],
    });
  }
  return posts;
}

// 5️.  Insert Data in Batches
async function storeData() {
  await connectDB();

  const totalPosts = 50000;
  const batchSize = 500;
  const posts = generateRandomPosts(totalPosts);

  const startTime = Date.now();

  try {
    for (let i = 0; i < totalPosts; i += batchSize) {
      const batch = posts.slice(i, i + batchSize);

      const batchStart = Date.now();
      await InstaModel.insertMany(batch);
      const batchEnd = Date.now();

      console.log(
        `Inserted batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(
          totalPosts / batchSize
        )} (${batch.length} posts) in ${batchEnd - batchStart}ms`
      );
    }

    const endTime = Date.now();
    console.log(
      `Successfully inserted ${totalPosts} posts in ${endTime - startTime}ms`
    );
  } catch (error) {
    console.error("Error inserting data:", error);
  } finally {
    process.exit(0);
  }
}

// 6️. Run the Function
storeData();
