/**
 * CloudConvert API Client
 * Handles file conversion tasks (3D models, images, documents, etc.)
 */

class CloudConvertClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.cloudconvert.com/v2';
    }

    async createJob(input, outputFormat, options = {}) {
        const jobData = {
            tasks: {
                'import': {
                    operation: 'import/url',
                    url: input.url || input,
                },
                'convert': {
                    operation: 'convert',
                    input: 'import',
                    output_format: outputFormat,
                    ...options,
                },
                'export': {
                    operation: 'export/url',
                    input: 'convert',
                },
            },
            tag: options.tag || 'web-conversion',
        };

        const response = await fetch(`${this.baseUrl}/jobs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jobData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`CloudConvert API error: ${error.message || response.statusText}`);
        }

        return await response.json();
    }

    async getJobStatus(jobId) {
        const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
            },
        });

        if (!response.ok) {
            throw new Error(`CloudConvert API error: ${response.statusText}`);
        }

        return await response.json();
    }

    async convertFile(input, outputFormat, options = {}) {
        // Create job
        const job = await this.createJob(input, outputFormat, options);
        const jobId = job.data.id;

        // Wait for job completion
        let jobStatus = await this.getJobStatus(jobId);
        const maxAttempts = 60; // 5 minutes max (5 second intervals)
        let attempts = 0;

        while (jobStatus.data.status !== 'finished' && attempts < maxAttempts) {
            if (jobStatus.data.status === 'error') {
                throw new Error(`CloudConvert job failed: ${jobStatus.data.message}`);
            }

            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            jobStatus = await this.getJobStatus(jobId);
            attempts++;
        }

        if (jobStatus.data.status !== 'finished') {
            throw new Error('CloudConvert job timeout');
        }

        // Get export URL
        const exportTask = jobStatus.data.tasks.find(t => t.operation === 'export/url');
        if (!exportTask || !exportTask.result?.files?.[0]?.url) {
            throw new Error('No export URL found');
        }

        return exportTask.result.files[0].url;
    }

    // Convenience methods for common conversions
    async convertToGLB(inputUrl, options = {}) {
        return this.convertFile(inputUrl, 'glb', {
            engine: 'blender',
            ...options,
        });
    }

    async convertToGLTF(inputUrl, options = {}) {
        return this.convertFile(inputUrl, 'gltf', {
            engine: 'blender',
            ...options,
        });
    }

    async convert3DModel(inputUrl, outputFormat, options = {}) {
        const supportedFormats = ['glb', 'gltf', 'obj', 'fbx', 'usdz', 'stl', 'ply'];
        if (!supportedFormats.includes(outputFormat.toLowerCase())) {
            throw new Error(`Unsupported 3D format: ${outputFormat}`);
        }
        return this.convertFile(inputUrl, outputFormat, {
            engine: 'blender',
            ...options,
        });
    }
}

export default CloudConvertClient;
