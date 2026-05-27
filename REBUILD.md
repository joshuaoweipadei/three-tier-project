# Rebuild Steps After terraform destroy

1. terraform apply (15-20 min)
2. aws eks update-kubeconfig --region us-east-1 --name jobboard-cluster
3. ECR login + docker buildx push (backend + frontend)
4. kubectl apply all k8s_manifests
5. Install ArgoCD
6. Install ALB controller via Helm
7. kubectl apply ingress.yaml
8. kubectl get ingress -n jobboard -w → get URL
EOF


git commit -m "add rebuild cheatsheet"
git push