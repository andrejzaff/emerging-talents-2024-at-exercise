const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json()); //  Parsing JSON data in the request body

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/'); // Specify the upload directory
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname.replace(/\s/g, '_')); // Use original filename 
    }
  });
  
  // Function to check file type
function checkFileType(file, cb) {
    // Allowed file types
    const filetypes = /jpeg|jpg|png|gif/;
    // Check the extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check the MIME type
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Only JPEG, JPG, PNG, and GIF files are allowed!');
    }
  }
  
  // Set up multer storage and file size limit
  const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, // 1 MB file size limit
    fileFilter: function (req, file, cb) {
      checkFileType(file, cb);
    }
  }).single('file');
  
  // Serve static files from the public directory
  app.use(express.static(path.join(__dirname, 'public')));
  
  // Serve uploaded files from the uploads directory
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  
  // File upload route
  app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // Multer errors (e.g., file size exceeded)
        res.status(400).json({ error: err.message });
      } else if (err) {
        // Other errors (e.g., file type not allowed)
        res.status(400).json({ error: err });
      } else {
        // No error, file uploaded successfully
        if (req.file == undefined) {
          res.status(400).json({ error: 'Error: No File Selected!' });
        } else {
          res.status(200).send('File uploaded successfully');
        }
      }
    });
  });
  
// List files in directory route
app.get('/files', (req, res) => {
    fs.readdir('uploads', (err, files) => {
      if (err) {
        res.status(500).send('Error listing files');
      } else {
        res.status(200).json(files);
      }
    });
  });
  
  const crypto = require('crypto');

// Function to calculate checksum of a file
function calculateChecksum(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const input = fs.createReadStream(filePath);

        input.on('error', reject);
        input.on('data', chunk => hash.update(chunk));
        input.on('end', () => resolve(hash.digest('hex')));
    });
}

// File download route
app.get('/download/:filename', async (req, res) => {
    const file = path.join(__dirname, 'uploads', req.params.filename);

    // Calculate checksum of original file
    const originalChecksum = await calculateChecksum(file);

    fs.stat(file, (err, stats) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.status(404).send('File not found');
            } else {
                res.status(500).send('Internal Server Error');
            }
        } else {
            res.status(200).download(file, (err) => {
                if (err) {
                    console.error('Error downloading file:', err);
                } else {
                    // Calculate checksum of downloaded file
                    calculateChecksum(file).then(downloadedChecksum => {
                        if (originalChecksum === downloadedChecksum) {
                            console.log('File downloaded successfully and checksums match.');
                        } else {
                            console.error('Downloaded file checksum does not match original file.');
                        }
                    }).catch(error => {
                        console.error('Error calculating checksum of downloaded file:', error);
                    });
                }
            });
        }
    });
});
  
  // File rename route
  app.put('/rename/:filename', (req, res) => {
    const oldPath = path.join(__dirname, 'uploads', req.params.filename);
    const newPath = path.join(__dirname, 'uploads', req.body.newFilename);
  
    fs.rename(oldPath, newPath, (err) => {
      if (err) {
        res.status(500).send('Error renaming file');
      } else {
        res.status(200).send('File renamed successfully');
      }
    });
  });

  // File delete route
  app.delete('/delete/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    
    fs.unlink(filePath, (err) => {
      if (err) {
        res.status(500).send('Error deleting file');
      } else {
        res.status(200).send('File deleted successfully');
      }
    });
  });
  
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
