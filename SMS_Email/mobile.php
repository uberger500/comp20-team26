<?php

$number= $_GET['num'];
$from= $_GET['name'];
$msg= $_GET['msg'];
$subj= $_GET['subj'];

mail($number, $subj, $msg);