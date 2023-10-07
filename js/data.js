async function fetchCrimes() {
    try {
        const response = await fetch('http://localhost:3020/', {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}
