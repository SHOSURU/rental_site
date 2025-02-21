1. Clone the Repository
First, clone your repository to your local machine using the following command:

bash
Copy
Edit
git clone https://github.com/SHOSURU/rental_site.git
2. Navigate to the Project Directory
After cloning, navigate to the project directory:

bash
Copy
Edit
cd rental_site
3. Install Dependencies
Your project uses Node.js, Express, and MongoDB Atlas, so you need to install all required dependencies.

Run the following command to install them:

bash
Copy
Edit
npm install
This will install everything listed in the package.json file.

4. Set Up Environment Variables
Make sure you have the necessary environment variables set for MongoDB and other configurations. You can create a .env file in the root of the project and add the following:

env
Copy
Edit
MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
Replace your_mongodb_connection_string with your MongoDB Atlas connection string and your_session_secret with a secure session secret.

5. Run the Project
You can now start the server using Nodemon. Run the following command:

bash
Copy
Edit
npm run dev
This should start the development server and you should be able to access your project at http://localhost:3000 in your browser.
