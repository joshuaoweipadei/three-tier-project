# These values are printed after terraform apply finishes
# Copy them — you need them in Steps C and D

output "aws_account_id" {
  description = "Your AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "cluster_name" {
  description = "EKS cluster name — used in kubectl commands"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "EKS API endpoint — where kubectl sends commands"
  value       = module.eks.cluster_endpoint
}

output "ecr_frontend_url" {
  description = "ECR URL for frontend — used in docker push and k8s manifests"
  value       = module.ecr.frontend_url
}

output "ecr_backend_url" {
  description = "ECR URL for backend — used in docker push and k8s manifests"
  value       = module.ecr.backend_url
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "kubectl_config_command" {
  description = "Run this after apply to connect kubectl to your cluster"
  value       = "aws eks update-kubeconfig --region ca-central-1 --name jobboard-cluster"
}

output "ecr_login_command" {
  description = "Run this to authenticate Docker with ECR before pushing images"
  value       = "aws ecr get-login-password --region ca-central-1 | docker login --username AWS --password-stdin ${data.aws_caller_identity.current.account_id}.dkr.ecr.ca-central-1.amazonaws.com"
}