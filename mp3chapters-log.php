<?php

// Log export events (without identifying information) to a JSONL file

$filename = 'mp3chapters-log.jsonl';

$jsonPayload = file_get_contents('php://input');
$data = json_decode($jsonPayload, true); // Decode as an associative array

// Function to validate the structure of the data
function isValidDataStructure($data) {
    // Define the expected keys and their value types
    $expectedKeys = [
        'durationMinutes' => 'integer',
        'numChapters' => 'integer',
        'usedImages' => 'boolean',
        'usedURLs' => 'boolean',
        'changedID3Fields' => 'boolean',
        'changedCoverImage' => 'boolean',
    ];

    // Check if all expected keys are present and have the correct type
    foreach ($expectedKeys as $key => $type) {
        if (!array_key_exists($key, $data) || gettype($data[$key]) !== $type) {
            return false; // Key missing or incorrect type
        }
    }

    return true; // Data structure is valid
}

if (json_last_error() === JSON_ERROR_NONE && isValidDataStructure($data)) {
    $file = fopen($filename, 'a');
    fwrite($file, json_encode($data, JSON_UNESCAPED_SLASHES) . PHP_EOL);
    fclose($file);
    echo json_encode(["message" => "Data appended successfully"]);
} else {
    // Respond with an error message if JSON parsing fails or data structure is invalid
    $errorMessage = json_last_error() !== JSON_ERROR_NONE ? 'Invalid JSON data' : 'Data structure is not as expected';
    echo json_encode(["error" => $errorMessage]);
}

?>