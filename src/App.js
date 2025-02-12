import "./App.css";
import React, { useState } from "react";
import Papa from "papaparse";
import {
	Document,
	Page,
	Text,
	View,
	Image,
	StyleSheet,
} from "@react-pdf/renderer";
import { BlobProvider } from "@react-pdf/renderer";

function App() {
	const [csvData, setCsvData] = useState([]);
	const [selectedQuestions, setSelectedQuestions] = useState([]);
	const [matches, setMatches] = useState([]);

	// State variables for user inputs
	const [nameQuestion, setNameQuestion] = useState("");
	const [genderQuestion, setGenderQuestion] = useState("");
	const [gradeQuestion, setGradeQuestion] = useState("");

	const handleFileUpload = (event) => {
		// Parse the CSV file into Papa Parse
		const file = event.target.files[0];
		Papa.parse(file, {
			header: true,
			complete: (result) => {
				setCsvData(result.data);
			},
		});
	};

	const handleQuestionSelect = (event) => {
		// Use only the selected questions.
		const question = event.target.value;
		if (event.target.checked) {
			setSelectedQuestions([...selectedQuestions, question]);
		} else {
			setSelectedQuestions(selectedQuestions.filter((q) => q !== question));
		}
	};

	const calculateMatches = () => {
		// Check that name, gender, and grade question are inside the CSV file.
		let proceed = true;
		if (!Object.keys(csvData[0] || {}).includes(nameQuestion)) {
			alert("The name question is not included in the CSV data uploaded!");
			proceed = false;
		}
		if (!Object.keys(csvData[0] || {}).includes(genderQuestion)) {
			alert("The gender question is not included in the CSV data uploaded!");
			proceed = false;
		}
		if (!Object.keys(csvData[0] || {}).includes(gradeQuestion)) {
			alert("The grade question is not included in the CSV data uploaded!");
			proceed = false;
		}

		// Lets match everyone!
		if (proceed) {
			// Sort the data alphabetically.
			const sortedData = [...csvData].sort((a, b) => {
				const nameA = a[nameQuestion]?.toLowerCase() || "";
				const nameB = b[nameQuestion]?.toLowerCase() || "";
				return nameA.localeCompare(nameB);
			});

			// For every person on the list
			const results = sortedData.map((person) => {
				let bestMatch = null;
				let bestScore = 0;
				let matchesList = [];

				// For every OTHER person on the list, compare how many questions they answered the same.
				sortedData.forEach((otherPerson) => {
					if (person !== otherPerson) {
						let score = 0;
						selectedQuestions.forEach((question) => {
							if (person[question] === otherPerson[question]) {
								score += 1;
							}
						});
						const percentage = Math.round(
							(score / selectedQuestions.length) * 100
						);
						matchesList.push({
							name: otherPerson[nameQuestion],
							grade: otherPerson[gradeQuestion],
							gender: otherPerson[genderQuestion],
							score: percentage,
						});
						if (percentage > bestScore) {
							bestScore = percentage;
							bestMatch = otherPerson;
						}
					}
				});

				// Sort all of our matches by their score.
				matchesList.sort((a, b) => b.score - a.score);

				// Spit out the matches.
				return {
					name: person[nameQuestion],
					bestMatch: bestMatch ? bestMatch[nameQuestion] : "None",
					bestScore: bestScore,
					matchesList: matchesList,
					gender: person[genderQuestion],
					grade: person[gradeQuestion],
				};
			});

			setMatches(results);
		}
	};

	// This is the output document for everyone's matches. Each person should have one page.
	const PDFDocument = () => (
		<Document>
			{matches.map((data, index) => (
				<Page key={index} size="Letter" style={styles.page}>
					<View style={styles.container}>
						<Image
							src="http://localhost:3000/background.png"
							style={styles.backgroundImage}
						/>
						<View style={styles.content}>
							<Text style={styles.title}>Love Gram for {data.name}</Text>
							<Text style={styles.subtitle}>
								Best Overall Match: {data.bestMatch}
							</Text>

							<View style={styles.columns}>
								<View style={styles.column}>
									<View style={styles.section}>
										<Text style={styles.sectionTitle}>
											Top 10 Matches in Your Grade
										</Text>
										{data.matchesList
											.filter(
												(m) =>
													!(m.gender === data.gender) && m.grade === data.grade
											)
											.slice(0, 10)
											.map((match, i) => (
												<Text key={i}>
													{i + 1}. {match.name} ({match.score}%)
												</Text>
											))}
									</View>

									<View style={styles.section}>
										<Text style={styles.sectionTitle}>
											Top 10 Friends in Your Grade
										</Text>
										{data.matchesList
											.filter(
												(m) =>
													m.gender === data.gender && m.grade === data.grade
											)
											.slice(0, 10)
											.map((match, i) => (
												<Text key={i}>
													{i + 1}. {match.name} ({match.score}%)
												</Text>
											))}
									</View>
								</View>

								<View style={styles.column}>
									<View style={styles.section}>
										<Text style={styles.sectionTitle}>
											Top Matches in Other Grades
										</Text>
										{data.matchesList
											.filter(
												(m) =>
													!(m.gender === data.gender) && m.grade !== data.grade
											)
											.slice(0, 10)
											.map((match, i) => (
												<Text key={i}>
													{i + 1}. {match.name} ({match.score}%)
												</Text>
											))}
									</View>

									<View style={styles.section}>
										<Text style={styles.sectionTitle}>
											Top Friends in Other Grades
										</Text>
										{data.matchesList
											.filter(
												(m) =>
													m.gender === data.gender && m.grade !== data.grade
											)
											.slice(0, 10)
											.map((match, i) => (
												<Text key={i}>
													{i + 1}. {match.name} ({match.score}%)
												</Text>
											))}
									</View>
								</View>
							</View>
							<Text style={styles.thanks}>Thank you for your support!</Text>
						</View>
					</View>
				</Page>
			))}
		</Document>
	);

	const styles = StyleSheet.create({
		page: {
			width: "100%",
			height: "100%",
		},
		content: {
			position: "relative",
			zIndex: -1, // Ensures content is above background
			padding: 30,
			width: "100%",
			height: "100%",
		},
		backgroundImage: {
			position: "absolute", // Ensures it stays in the background
			top: 0,
			left: 0,
			width: "100%",
			height: "100%",
			objectFit: "cover", // Ensures it fully covers the page
			zIndex: 1,
			opacity: 0.5,
		},
		title: {
			fontSize: 28,
			marginBottom: 20,
			textAlign: "center",
		},
		subtitle: {
			fontSize: 22,
			marginBottom: 35,
			textAlign: "center",
		},
		columns: {
			flexDirection: "row",
			justifyContent: "space-between",
		},
		column: {
			width: "45%",
		},
		section: {
			marginTop: 30,
			marginBottom: 30,
			fontSize: 14,
		},
		sectionTitle: {
			fontSize: 18,
			marginBottom: 5,
		},
		thanks: {
			fontSize: 22,
			marginTop: 55,
			marginBottom: 55,
			textAlign: "center",
		},
	});

	return (
		<div className="App">
			<h1>Love Grams Generator</h1>
			<input type="file" accept=".csv" onChange={handleFileUpload} />

			<div className="question-inputs">
				<label>Name Question:</label>
				<input
					type="text"
					value={nameQuestion}
					onChange={(e) => setNameQuestion(e.target.value)}
				/>

				<label>Gender Question:</label>
				<input
					type="text"
					value={genderQuestion}
					onChange={(e) => setGenderQuestion(e.target.value)}
				/>

				<label>Grade Question:</label>
				<input
					type="text"
					value={gradeQuestion}
					onChange={(e) => setGradeQuestion(e.target.value)}
				/>
			</div>

			{csvData.length > 0 && (
				<div className="questions">
					<h2>Select Questions to Compare</h2>
					{Object.keys(csvData[0]).map((question, index) => (
						<div key={index} className="question">
							<input
								type="checkbox"
								id={`question-${index}`}
								value={question}
								onChange={handleQuestionSelect}
							/>
							<label htmlFor={`question-${index}`}>{question}</label>
						</div>
					))}
				</div>
			)}

			<button onClick={calculateMatches} className="generate-button">
				Generate Love Grams
			</button>

			<div className="pdf-links">
				<BlobProvider document={<PDFDocument />}>
					{({ url, loading, error }) => {
						if (loading) return "Generating PDF...";
						if (error) return "Error generating PDF." + error;
						return (
							<a href={url} target="_blank" rel="noopener noreferrer">
								View PDF
							</a>
						);
					}}
				</BlobProvider>
			</div>
		</div>
	);
}

export default App;
