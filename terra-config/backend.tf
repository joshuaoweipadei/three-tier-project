terraform {
  backend "s3" {
    bucket = "three-tier-user-jobboard-tfstate-459499397949-us-east-1-an"
    key    = "jobboard/terraform.tfstate"
    region = "us-east-1"

    # Encrypts the state file at rest inside S3
    encrypt = true
  }
}