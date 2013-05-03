<?php

$email= $_GET['Email'];
$msg= $_GET['smsMessage'];
$subj= $_GET['Subj'];

mail($email, $subj, $msg);

?>