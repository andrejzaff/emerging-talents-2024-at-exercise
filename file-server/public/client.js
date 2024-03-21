const uploadForm = document.getElementById('uploadForm');
const fileList = document.getElementById('fileList');
const message = document.getElementById('message');

// Fetch file list
fetch('/files')
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to fetch file list');
    }
    return response.json();
  })
  .then(data => {
    // Process the list of files (data)
  })
  .catch(error => {
    console.error('Error fetching file list:', error);
  });

// Handle file upload
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // Prevent default form submission behavior
  
  const formData = new FormData(uploadForm);
  const response = await fetch('/upload', {
    method: 'POST',
    body: formData
  });

  if (response.ok) {
    // Display success message for successful upload
    message.textContent = 'File uploaded successfully';
    listFiles(); // Refresh file list
  } else {
    // Parse the JSON response to extract the error message
    const responseData = await response.json();
    const errorMessage = responseData.error;

    if(errorMessage) {
      // Display the error message to the user
      message.textContent = errorMessage;
    } else {
      console.error('Error uploading file');
    }
  }
});

// Function to refresh the file list
function listFiles() {
  // Fetch request to retrieve the list of files
  fetch('/files')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch file list');
      }
      return response.json();
    })
    .then(data => {
      fileList.innerHTML = ''; 
      
      if (data.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = 'No files available.';
        fileList.appendChild(emptyMessage);
      } else {
        data.forEach(filename => {
          const li = document.createElement('li');
          li.textContent = filename;
          
          // Create delete button
          const deleteButton = document.createElement('button');
          deleteButton.textContent = 'Delete';
          deleteButton.className = 'delete-button'; 
          deleteButton.onclick = function() {
            deleteFile(filename);
          };
          
          // Append delete button to the list item
          li.appendChild(deleteButton);
          
          // Append list item to the file list
          fileList.appendChild(li);
        });
      }

      // Populate dropdown menus after fetching file list
      populateDropdownMenus(data);
    })
    .catch(error => {
      console.error('Error fetching file list:', error);
    });
}

// Function to populate dropdown menus
function populateDropdownMenus(files) {
    const oldFilenameSelect = document.getElementById('oldFilenameSelect');
    const fileSelect = document.getElementById('fileSelect');
    oldFilenameSelect.innerHTML = '';
    fileSelect.innerHTML = '';
  
    // Add the default "Select file" option to both dropdown menus
    const defaultOption = document.createElement('option');
    defaultOption.text = 'Select file';
    oldFilenameSelect.appendChild(defaultOption.cloneNode(true));
    fileSelect.appendChild(defaultOption.cloneNode(true));
  
    // Populate the dropdown menus with file options
    files.forEach(filename => {
      const optionOld = document.createElement('option');
      const optionNew = document.createElement('option');
      optionOld.value = filename;
      optionOld.textContent = filename;
      optionNew.value = filename;
      optionNew.textContent = filename;
      oldFilenameSelect.appendChild(optionOld);
      fileSelect.appendChild(optionNew);
    });
  }

// Function to delete file
function deleteFile(filename) {
  fetch(`/delete/${filename}`, {
    method: 'DELETE'
  })
  .then(response => {
    if (response.ok) {
      console.log('File deleted successfully');
      listFiles(); // Refresh file list
    } else {
      throw new Error('Failed to delete file');
    }
  })
  .catch(error => {
    console.error('Error deleting file:', error);
  });
}

// Function to handle rename button
function renameFile() {
    const oldFilename = document.getElementById('oldFilenameSelect').value;
    const newFilename = document.getElementById('newFilename').value;
    if (!oldFilename || !newFilename) {
        console.error('Both old and new filenames are required');
        return;
    }

    // Ask for confirmation using a popup
    const confirmed = confirm(`Are you sure you want to rename "${oldFilename}" to "${newFilename}"?`);
    if (!confirmed) {
        return; 
    }

    // Send the rename request to the server
    fetch(`/rename/${oldFilename}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newFilename: newFilename })
    })
    .then(response => {
        if (response.ok) {
            console.log('File renamed successfully');
            listFiles(); 
        } else {
            throw new Error('Failed to rename file');
        }
    })
    .catch(error => {
        console.error('Error renaming file:', error);
    });
}

// Function to handle download button
function downloadSelectedFile() {
  const select = document.getElementById('fileSelect');
  const selectedFilename = select.value;
  if (!selectedFilename) {
    console.error('Please select a file to download.');
    return;
  }

  // Fetch request to download the file
  fetch(`/download/${selectedFilename}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('File not found');
      }
      return response.blob();
    })
    .then(blob => {
      // Create a temporary anchor element to trigger the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedFilename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    })
    .catch(error => {
      console.error('Error downloading file:', error);
    });
}

var fileListVisible = false;

    function toggleFileList() {
      var fileList = document.getElementById("fileListContainer");
      if (fileListVisible) {
        fileList.style.display = "none";
        fileListVisible = false;
      } else {
        fileList.style.display = "block";
        fileListVisible = true;
        listFiles(); 
      }
    }

