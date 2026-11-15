<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/26726c85-e3fe-4725-8aec-8ff5a1d67597

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Class codes

Teachers can create classes from the teacher dashboard and share the generated code with students.
Students enter that code from their dashboard to join; each teacher can only read the roster for
their own classes. Deploy the Firestore rules before using this feature:

1. Sign in to Firebase CLI with `firebase login`.
2. Deploy rules to the project configured by the app:
   `firebase deploy --only firestore:rules --project onlinequiz-b7449`

Only accounts whose Firestore profile has the `teacher` role can create classes. Assign teacher
roles through a trusted administrator; do not let users choose their role during registration.

## Teacher-created quizzes

Teachers can create and publish multiple-choice quizzes from the teacher dashboard. Students can
complete each published quiz once and see the score and explanations after submission. Question
content and answer keys are stored separately; students cannot read answer keys before submitting.
The current MVP calculates the displayed score in the browser, so it is intended for practice rather
than high-stakes grading.
