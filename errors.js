class ConcurrentDeploymentError extends Error {
    constructor (message) {
        super(message)
        this.name = 'ConcurrentDeploymentError'
    }
}
