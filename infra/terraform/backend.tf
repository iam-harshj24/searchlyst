terraform {
  backend "gcs" {
    # Bucket name and prefix are passed at init time, e.g.:
    #   terraform init \
    #     -backend-config="bucket=searchlyst-tfstate" \
    #     -backend-config="prefix=searchlyst/${ENV}"
    #
    # Create the bucket once with infra/terraform/bootstrap-state-bucket.sh.
  }
}
