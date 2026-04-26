import mongoose from 'mongoose';
import fs from 'fs';
import csv from 'csv-parser'; // install this
import Counslling from "./lib/model.js"
import dotenv from 'dotenv';
dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

// helper to parse date
const parseDate = (dateStr) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length !== 3) return new Date();
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
};

// helper for revisit
const parseRevisit = (value) => {
    if (!value || value.trim() === '') return [];

    // if it's a date
    if (value.includes('-')) {
        return [parseDate(value)];
    }

    if (value.toLowerCase().includes('revisit')) {
        return [new Date()];
    }

    return [];
};

const results = [];

fs.createReadStream('./data.csv') // convert your excel to csv
    .pipe(csv())
    .on('data', (row) => {
        try {
            const doc = {
                fullName: row["CANDIDATE'S NAME"]?.trim(),
                fatherName: row["FATHER'S NAME"]?.trim(),
                motherName: row["MOTHER NAME"]?.trim(),

                emailId: row["E-MAIL"]?.trim() || '',
                studentContactNo: row["STUDENT'S MOBILE NO"]?.trim(),

                fatherContactNo: row["FATHER'S MOBILE NO"]?.trim(),

                permanentAddress: row["ADDRESS"]?.trim(),
                category: row["CATEGORY-GEN/OBC/SC/ST"]?.trim(),

                coursesInterested: row["COURSE"]
                    ? [row["COURSE"].trim()]
                    : [],

                entranceExamsGiven:
                    row["ENTRANCE EXAM GIVEN (yes/no)"] === 'yes'
                        ? [row["TYPE OF ENTRANCE EXAM (JEE/CUET/CET)"]]
                        : [],

                academicDetails: [
                    {
                        examination: '10th',
                        schoolOrCollegeName: row["SCHOOL NAME"] || '',
                    },
                ],

                revisitDates: parseRevisit(row["REVISIT"]),

                submittedAt: parseDate(row["DATE"]),
                sheetSynced: true,
            };

            results.push(doc);
        } catch (err) {
            console.log('Error parsing row:', err);
        }
    })
    .on('end', async () => {
        console.log(`Parsed ${results.length} records`);

        // 🔥 insert all
        await Counslling.insertMany(results);

        console.log('✅ Data imported successfully');
        process.exit();
    });