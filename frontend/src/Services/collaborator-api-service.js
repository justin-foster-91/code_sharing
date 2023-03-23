import config from '../config'
import TokenService from './token-service'

const InstanceApiService = {
  getCollaboratorsByInstance(id){
    return fetch(`${config.API_ENDPOINT}/instances/${id}/collaborators`, {
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
  // userIDs []
  deleteCollaboratorsByInstance(id, userIDs){
    console.log("EXTERMINATE: ", id, userIDs);
    return fetch(`${config.API_ENDPOINT}/instances/${id}/collaborators`, {
      method: 'DELETE',
      headers: {
        'content-type': 'application/json',
        'authorization': `bearer ${TokenService.getAuthToken()}`,
      },
      body: JSON.stringify(userIDs),
    })
      .then(res =>
        (!res.ok)
          ? res.json().then(e => Promise.reject(e))
          : res.json()
      )
  },
  postCollaboratorsByInstance(id, collaborator_name, permission_type){
    return fetch(`${config.API_ENDPOINT}/instances/${id}/collaborators`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `bearer ${TokenService.getAuthToken()}`,
      },
      body: JSON.stringify({ collaborator_name, permission_type }),
    })
      .then(res =>
        (!res.ok)
          ? res.json().then(e => Promise.reject(e))
          : res.json()
      )
  },
}

export default InstanceApiService;