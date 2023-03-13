class ConcurrentDeploymentError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ConcurrentDeploymentError'
  }
}

class DeploymentIncompleteError extends Error {
  constructor(mesage) {
    super(mesage)
    this.name = 'DeploymentIncompleteError'
  }
}

class CommandError extends Error {
  constructor(mesage) {
    super(mesage)
    this.name = 'CommandError'
  }
}

module.exports = {
  ConcurrentDeploymentError,
  DeploymentIncompleteError,
  CommandError,
}
