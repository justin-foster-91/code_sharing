import config from '../config'
import TokenService from './token-service'
// import IdleService from './idle-service'

const InstanceApiService = {
  getPublicInstances(page, search){
    return fetch(`${config.API_ENDPOINT}/gallery?page=${page}&search=${search}`, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
      },
    })
      .then(res =>
        (!res.ok)
          ? res.json().then(e => Promise.reject(e))
          : res.json()
      )
  },
  getInstanceById(id){
    return fetch(`${config.API_ENDPOINT}/instances/${id}`, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'authorization': `bearer ${TokenService.getAuthToken()}`,
      },
    })
      .then(res =>
        (!res.ok)
          ? res.json().then(e => Promise.reject(e))
          : res.json()
      )
  },
  getPublicInstanceById(id){
    return fetch(`${config.API_ENDPOINT}/public-instance/${id}`, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
      },
    })
      .then(res =>
        (!res.ok)
          ? res.json().then(e => Promise.reject(e))
          : res.json()
      )
  },
  getInstancesByUser(history, page, search, sortDirection, sort){
    return fetch(`${config.API_ENDPOINT}/instances?page=${page}&search=${search}&sort=${sort}&sortDirection=${sortDirection}`, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'authorization': `bearer ${TokenService.getAuthToken()}`,
      },
    })
    .then(res =>
      (!res.ok)
        ? res.json().then(e => {
          // TODO: Check error message and act accordingly
          // This is used if user logs out, then immediately hits back to return to /instances
          // Error message needs to be looked at.
          if (history) history.push('/gallery')
          // return Promise.reject(e)
        })
        : res.json()
    )
  },
  getUserById(id, page, search){
    page = page || 1
    let searchPath = search ? `&search=${search}` : ""
    return fetch(`${config.API_ENDPOINT}/mages/${id}?page=${page}${searchPath}`, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'authorization': `bearer ${TokenService.getAuthToken()}`,
      },

    })
      .then(res =>
        (!res.ok)
          ? res.json().then(e => Promise.reject(e))
          : res.json()
      )
  },
  postNewInstance(title){
    return fetch(`${config.API_ENDPOINT}/instances?title=${title}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `bearer ${TokenService.getAuthToken()}`,
      },
    })
      .then(res =>
        (!res.ok)
          ? res.json().then(e => Promise.reject(e))
          : res.json()
      )
  },
  forkInstanceById(id){
    return fetch(`${config.API_ENDPOINT}/instances/${id}/fork`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `bearer ${TokenService.getAuthToken()}`,
      },
    })
      .then(res =>
        (!res.ok)
          ? res.json().then(e => Promise.reject(e))
          : res.json()
      )
  },
  deleteInstances(id){
    id = typeof(id) === 'number' ? id : id.join(',')
    return fetch(`${config.API_ENDPOINT}/instances/${id}`, {
      method: 'DELETE',
      headers: {
        'content-type': 'application/json',
        'authorization': `bearer ${TokenService.getAuthToken()}`,
      },
      // body: JSON.stringify(payload)
    })
      .then(res =>
        (!res.ok)
          ? res.json().then(e => Promise.reject(e))
          : res.json()
      )
  },
  updateInstance(payload, id){
    return fetch(`${config.API_ENDPOINT}/instances/${id}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        'authorization': `bearer ${TokenService.getAuthToken()}`,
      },
      body: JSON.stringify(payload)
    })
      .then(res =>
        (!res.ok)
          ? res.json().then(e => Promise.reject(e))
          : res.json()
      )
  },
  checkForInstanceOwnership(instance_id){
    return fetch(`${config.API_ENDPOINT}/check-ownership/${instance_id}`, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'authorization': `bearer ${TokenService.getAuthToken()}`,
      },
    })
      .then(res =>
        (!res.ok)
          ? res.json().then(e => Promise.reject(e))
          : res.json()
      )
  },
}

export default InstanceApiService
