<?php

// getting variables from form

$emailTo = trim($_REQUEST['address']);
$subject = trim($_REQUEST['title']);;
$name = trim($_REQUEST['name']);
$emailFrom = trim($_REQUEST['mail']);
$message = $_REQUEST['message'];

// prepare email body text

$Body = "You have registered for Wingman, ";
$Body .= $name;
$Body .= ".\n";
$Body .= "\n";
$Body .= $message;

// send prepared message

$sent = mail($emailTo, $subject, $Body);


?>