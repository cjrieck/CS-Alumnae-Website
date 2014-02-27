<?php
$con=mysqli_connect("localhost:7500","facsem","buffalotexas","alum_site");
// Check connection
if (mysqli_connect_errno())
  {
  echo "Failed to connect to MySQL: " . mysqli_connect_error();
  }

$result = mysqli_query($con,"SELECT * FROM users");

$row = mysqli_fetch_array($result)

echo  $row['firstName'];

mysqli_close($con);
?> 
