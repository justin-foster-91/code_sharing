//This is the page that renders the list of instances
import React, { useEffect, useState, useContext } from 'react';
import { useHistory } from "react-router-dom";
import InstanceTable from './InstanceTable';
import Dashboard from './Dashboard';
import InstanceApiService from '../../Services/instance-api-service';
import FabAddIcon from './FabAddIcon';
import { UserContext } from '../../Context/userContext';


function InstanceIndex(props) {
  const [instances, setInstances] = useState([])
  const [totalInstances, setTotalInstances] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = React.useState('');
  const [sortDirection, setSortDirection] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('');
  const { userData } = useContext(UserContext);

  let history = useHistory();
  
  useEffect(() => {

    if(userData.isLoggedIn){
      InstanceApiService.getInstancesByUser(history, currentPage, search, sortDirection, orderBy)
        .then(instanceList => {
          if (!instanceList) return;

          setInstances(instanceList.instances)
          setTotalInstances(instanceList.total)
        })
    }
  }, [currentPage, refresh, search, sortDirection, orderBy, props, history])

  function createInstance(event) {
    InstanceApiService.postNewInstance()
      .then(instances => {
        setInstances([...instances, instances])
      })
  }

  return (
    <Dashboard
      instances={instances}
      setInstances={setInstances}
      createInstance={createInstance}
      child={<InstanceTable
        setCurrentPage={setCurrentPage}
        setSearch={setSearch}
        setSortDirection={setSortDirection}
        sortDirection={sortDirection}
        orderBy={orderBy}
        setOrderBy={setOrderBy}
        instances={instances}
        totalInstances={totalInstances}
        onChange={(changedInstance) => setInstances(instances.map(instance => changedInstance.id === instance.id ? changedInstance : instance))}
        onDelete={(deletedInstanceID) => setInstances(instances.filter(instance => instance.id !== deletedInstanceID))}
        setRefresh={setRefresh}
      />}
      fabIcon={<FabAddIcon
        instances={instances}
        setInstances={setInstances}
        clickIcon={createInstance}
      />}
    >
    </Dashboard>
  )
}

export default InstanceIndex;
